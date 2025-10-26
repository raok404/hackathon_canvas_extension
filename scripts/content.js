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

const domain = window.location.origin;
const current_page = window.location.pathname;

let assignments = [];

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
  let course_id_array = []
  data.forEach((element)=> {
    course_id_array.push(element.course_id)
    console.log("added", element.course_id, "in array")//debugging
  });

  classes_array = [];
  data2 = await getData("/api/v1/users/self/courses?enrollment_state=active&per_page=30")
  data2.forEach((element)=> {
    if (course_id_array.includes(element.id)) {
      classes_array.push([element.id, element.course_code]); //could also try .name if you want the whole name
    }
  });
  chrome.storage.local.set({classes: classes_array});
  console.log("stored", classes_array)//debugging
}

saveClasses()

async function saveAllAssignments(){
  let allList = [];
  let doneList = [];
  let notDoneList = [];

  //logic for counting points
  let countOntime = 0;
  let countEarly = 0;
  let countSuperEarly = 0;
  const today = new Date().toISOString();

  let prevDone = await chrome.storage.local.get("completeAssignments");
  prevDone = prevDone.completeAssignments;
  let prevNotDone = await chrome.storage.local.get("incompleteAssignments");
  prevNotDone = prevNotDone.incompleteAssignments;
  console.log(prevDone)

  classList = await chrome.storage.local.get("classes");
  console.log(classList);

  for (const subList of classList.classes) {
    items = await getData(`/api/v1/courses/${subList[0]}/assignment_groups?include[]=assignments&include[]=submission`);

    items.forEach((group)=> {
      //console.log(element.name);
      assignmentList = group.assignments
      assignmentList.forEach((assignment)=>{
        //console.log("   ", assignment.name);
      const assignmentInfo = [assignment.course_id,
        assignment.name, // assignment name (ex exam 1, unit 3 quiz)
        group.name, //category name (ex exam, quiz, lab)
        assignment.due_at, //due date=time
        assignment.points_possible, //how many pts the assignment is worth
        assignment.html_url,//can give user a link to the assingment!
        assignment.submission.workflow_state];//did they submit yet

      allList.push(assignmentInfo);
      
      if (assignment.submission.workflow_state == "unsubmitted") {
        notDoneList.push(assignmentInfo);
      }
      else {
        doneList.push(assignmentInfo);
      }

      });
    });
  };

  for (const assignment of prevNotDone){
    for (const doneAssignment of allList) {//for debugging. change to doneList when ready
      if ((assignment[1] == doneAssignment[1]) && (assignment[0] == doneAssignment[0])) {
        countEarly += 1;
      }
    }
  }

  console.log(countEarly);

  chrome.storage.local.set({allAssignments: allList}); //may not need this??
  chrome.storage.local.set({incompleteAssignments: notDoneList});
  chrome.storage.local.set({completeAssignments: doneList});
  console.log("stored")//debugging
}

saveAllAssignments()

