document.addEventListener("DOMContentLoaded", () => {
  const feedback = document.getElementById("feedback");
  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");
  const WEEKLY_GOAL = 25;

  const timerBtn = document.getElementById("timerBtn");
  const calendarBtn = document.getElementById("calendarBtn");
  const themeToggle = document.getElementById("themeToggle");
  const dailyTip = document.getElementById("dailyTip");

  const focusCheck = document.getElementById("focusCheck");
  if (focusCheck) {
    focusCheck.addEventListener("click", () => {
      feedback.innerText = "Focus check complete. Stay sharp!";
    });
  }

  const reflectBtn = document.getElementById("reflectBtn");
  if (reflectBtn) {
    reflectBtn.addEventListener("click", () => {
      const prompts = [
        "What distracted you most today?",
        "Which task felt most rewarding?",
        "How can you make tomorrow 1% better?",
        "Did you give your full attention today?",
        "What’s one thing you can finish earlier tomorrow?"
      ];
      const random = prompts[Math.floor(Math.random() * prompts.length)];
      feedback.innerText = `${random}`;
    });
  }


  function updateProgress(totalPoints) {
    const percent = Math.min((totalPoints / WEEKLY_GOAL) * 100, 100);
    progressFill.style.width = `${percent}%`;
    progressLabel.innerText = `${totalPoints} / ${WEEKLY_GOAL} Points`;
  }

  if (chrome.storage) {
    chrome.storage.local.get("points", (data) => {
      const total = data.points || 0;
      updateProgress(total);
      renderAssignments(total);
    });
  }

  // const assignments = [
  //   { id: 1, name: "Module 9 Quiz", due: "2025-10-28T23:59:00" },
  //   { id: 2, name: "Essay Draft", due: "2025-10-27T23:59:00" },
  //   { id: 3, name: "Project Presentation", due: "2025-10-30T23:59:00" },
  //   { id: 4, name: "Lab Report", due: "2025-10-31T23:59:00" }
  // ];


  async function renderAssignments(totalPoints) {
    const assignmentsLoaded = await chrome.storage.local.get("assignments");
    const assignments = assignmentsLoaded.assignments.assignmentList;
    console.log("SIDEBAR ASSIGNMENTS ", assignments);

    const list = document.getElementById("todoList");
    if (!list) return;

    list.innerHTML = "";
    assignments.forEach(a => {
      const due = new Date(a.dueDate);
      const now = new Date();
      const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));

      if (diffDays <= 7 && diffDays >= 0) {
        const card = document.createElement("div");
        card.className = "todo-card";
        card.innerHTML = `
          <h3 class="todo-title">${a.name}</h3>
          <p class="todo-date">Due: ${due.toLocaleString()}</p>
          <button id="btn-${a.assignment_id}">Mark Complete</button>
          <p class="points" id="points-${a.assignment_id}">${a.points} pts total</p>
        `;
        styleCard(card, diffDays);
        list.appendChild(card);

        card.querySelector(`#btn-${a.assignment_id}`).addEventListener("click", () => {
          completeAssignment(a.assignment_id, a.dueDate);
        });
      }
    });
  }

  function styleCard(card, diffDays) {
    if (diffDays === 0) card.style.borderLeft = "5px solid red";
    else if (diffDays <= 2) card.style.borderLeft = "5px solid orange";
    else card.style.borderLeft = "5px solid green";
  }

  function completeAssignment(id, dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));
    let points = diffDays >= 3 ? 3 : diffDays >= 1 ? 2 : 1;

    chrome.storage.local.get("points", (data) => {
      const total = (data.points || 0) + points;
      chrome.storage.local.set({ points: total }, () => {
        document.getElementById(`points-${id}`).innerText = `${total} pts total`;
        feedback.innerText = `You earned ${points} point${points > 1 ? "s" : ""}!`;
        updateProgress(total);
      });
    });
  }

  timerBtn.addEventListener("click", () => {
    window.open(
      chrome.runtime.getURL("timer.html"),
      "focusTimer",
      "width=420,height=520,left=200,top=100,resizable=yes,scrollbars=no"
    );
  });


  let hidden = false;
  calendarBtn.addEventListener("click", () => {
    window.open(
      "calendar.html",
        "popupWindow",
        "width=800, height=600,left=100,top=100,resizeable=yes,scrollbars=yes"
    )

  });
        

  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "refreshPoints" && message.totalPoints !== undefined) {
        console.log("Sidebar received refreshed points:", message.totalPoints);
        updateProgress(message.totalPoints);
        feedback.innerText = `Timer complete! You now have ${message.totalPoints} total points!`;
      }
    });
  }

  if (chrome.storage) {
    chrome.storage.local.get("theme", (data) => {
      if (data.theme === "dark") document.body.classList.add("dark-mode");
    });

    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const mode = document.body.classList.contains("dark-mode") ? "dark" : "light";
      chrome.storage.local.set({ theme: mode });
    });
  }

  const tips = [
    "Start your day early — like a true Early Bird 🌅",
    "Complete one task before breakfast 🥚",
    "Early work = stress-free afternoon 🌤️",
    "Reward yourself for starting early ☕",
    "Every morning is a new opportunity 🚀"
  ];
  dailyTip.innerText = tips[Math.floor(Math.random() * tips.length)];
});
