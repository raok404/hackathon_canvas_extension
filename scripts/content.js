console.log("[FocusFlow] content script loaded on", location.href);

let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log("[FocusFlow] route changed → re-init on", lastUrl);
    initFocusFlow();
  }
}, 500);

initFocusFlow();

function initFocusFlow() {
  if (document.body.dataset.ffInitialized === "1") return;
  document.body.dataset.ffInitialized = "1";
  console.log("[FocusFlow] initializing");

  injectStyle(`
    /* Hide Canvas right sidebar & crumbs bar when they exist */
    #right-side,
    .ic-app-nav-toggle-and-crumbs__bar {
      visibility: hidden !important;
    }
  `);

  addOrUpdateBanner("FocusFlow Active — Distractions Hidden");

  watchFor("#right-side, .ic-app-nav-toggle-and-crumbs__bar", (el) => {
    el.style.visibility = "hidden";
    console.log("[FocusFlow] hid:", el.className || el.id || el.tagName);
  });
}

function injectStyle(css) {
  const id = "ff-style-hide";
  let tag = document.getElementById(id);
  if (!tag) {
    tag = document.createElement("style");
    tag.id = id;
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

function addOrUpdateBanner(text) {
  const id = "ff-banner";
  let b = document.getElementById(id);
  if (!b) {
    b = document.createElement("div");
    b.id = id;
    Object.assign(b.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      background: "#0066ff",
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
      textAlign: "center",
      padding: "8px",
      zIndex: "9999",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    });
    document.body.appendChild(b);
  }
  b.textContent = text;
}

function watchFor(selector, onFound) {
  document.querySelectorAll(selector).forEach(onFound);

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            if (n.matches?.(selector)) onFound(n);
            n.querySelectorAll?.(selector).forEach(onFound);
          }
        });
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
}


async function getData(endpoint) {
  try {
    const resp = await fetch(endpoint, { 
      method: "GET", 
      credentials: "include" // ensures Canvas session cookies are sent
    });

    if (!resp.ok) {
      console.error("Request failed:", resp.status, resp.statusText);
      return null;
    }

    const data = await resp.json();
    return data;

  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}


async function saveClasses(){
  //updates "classes" - a nested list of the course_id and "text" course name
  data = await getData("/api/v1/users/self/todo");
  let course_id_array = [] //array of active course ids
  data.forEach((element)=> {
    course_id_array.push(element.course_id)
    console.log("added", element.course_id, "in array")//debugging
  });

  classes_dict = {};
  data2 = await getData("/api/v1/users/self/courses?enrollment_state=active&per_page=30")
  data2.forEach((element)=> {
    if (course_id_array.includes(element.id)) {
      classes_dict[element.id] = element.name;
       //could also try .name if you want the whole name XXX2024 - Physics
       //course_code for short XXX2024
    }
  });
  chrome.storage.local.set({classes: classes_dict});
  console.log("stored", classes_dict)//debugging
}

saveClasses()

async function saveAllAssignments(){
  //logic for counting points
  let countOntime = 0;
  let countEarly = 0;
  let countSuperEarly = 0;//

  const today = new Date().toISOString();

  classDict = await chrome.storage.local.get("classes");
  console.log(classDict);

  storedAssignments = await chrome.storage.local.get("assignments") || {};
  console.log(storedAssignments);

  let assignmentWeights = {};
  let assignmentList = [];

  for (const [courseID, courseName] of Object.entries(classDict.classes)) {
    console.log(courseID, "ID");//
    let assignmentIterator = await getData(`/api/v1/courses/${courseID}/assignment_groups?include[]=assignments&include[]=submission`);
    console.log(assignmentIterator, " TESTING");//
    assignmentWeights[courseID] = {};

    assignmentIterator.forEach((group)=> {
      //console.log(element.name);
      //assignment weights for each group
      assignmentWeights[courseID][group.name] = group.group_weight;//fix r=this

      assignmentIterator = group.assignments
      assignmentIterator.forEach((assignment)=>{
        //console.log("   ", assignment.name);
      const assignmentInfo = {
        course: assignment.course_id,
        name: assignment.name, // assignment name (ex exam 1, unit 3 quiz)
        category: group.name, //category name (ex exam, quiz, lab)
        dueDate: assignment.due_at, //due date=time
        points: assignment.points_possible, //how many pts the assignment is worth
        url: assignment.html_url,//can give user a link to the assingment!
      };

      if (assignment.submission) { // if they submitted the assignment
        assignmentInfo.submissionState = assignment.submission.workflow_state;//did they submit yet (submitted, unsubmitted, graded, pending_review)
        assignmentInfo.submissionDate = assignment.submission.submitted_at;//time and date
      }
      else {
        assignmentInfo.submissionState = false;
        assignmentInfo.submissionDate = null;
      }

      assignmentList.push(assignmentInfo);

      });
    });
  };

  chrome.storage.local.set({assignments: {assignmentWeights, assignmentList}}); //may not need this??
  console.log("stored weights", assignmentWeights);//debugging
  console.log("stored assignments", assignmentList);
}

saveAllAssignments();

