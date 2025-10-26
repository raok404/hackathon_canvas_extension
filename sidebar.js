document.addEventListener("DOMContentLoaded", () => {
  const feedback = document.getElementById("feedback");
  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");
  const WEEKLY_GOAL = 15;

  const timerBtn = document.getElementById("timerBtn");
  const distractionBtn = document.getElementById("distractionBtn");
  const themeToggle = document.getElementById("themeToggle");
  const dailyTip = document.getElementById("dailyTip");

  document.getElementById("focusCheck").addEventListener("click", () => {
    feedback.innerText = "Focus check complete. Stay sharp!";
  });

  document.getElementById("reflectBtn").addEventListener("click", () => {
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

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get("points", (data) => {
      const totalPoints = data.points || 0;
      updateProgress(totalPoints);
      renderList(totalPoints);
    });
  }

  const assignments = [
    { id: 1, name: "Module 9 Quiz", due: "2025-10-28T23:59:00" },
    { id: 2, name: "Essay Draft", due: "2025-10-27T23:59:00" },
    { id: 3, name: "Project Presentation", due: "2025-10-30T23:59:00" },
    { id: 4, name: "Lab Report", due: "2025-10-31T23:59:00" }
  ];

  function renderList(totalPoints) {
    const list = document.getElementById("todoList");
    list.innerHTML = "";
    assignments.forEach(a => {
      const due = new Date(a.due);
      const now = new Date();
      const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays >= 0) {
        const card = document.createElement("div");
        card.className = "todo-card";
        card.innerHTML = `
          <h3 class="todo-title">${a.name}</h3>
          <p class="todo-date">Due: ${due.toLocaleString()}</p>
          <button id="btn-${a.id}">Mark Complete</button>
          <p class="points" id="points-${a.id}"> ${totalPoints} pts total</p>
        `;
        styleCard(card, diffDays);
        list.appendChild(card);
        card.querySelector(`#btn-${a.id}`).addEventListener("click", () => {
          completeAssignment(a.id, a.due);
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
    let points = 1;
    if (diffDays >= 3) points = 3;
    else if (diffDays >= 1) points = 2;

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get("points", (data) => {
        const total = (data.points || 0) + points;
        chrome.storage.local.set({ points: total }, () => {
          document.getElementById(`points-${id}`).innerText = ` ${total} pts total`;
          feedback.innerText = ` You earned ${points} point${points > 1 ? "s" : ""}!`;
          updateProgress(total);
        });
      });
    }
  }

  function updateProgress(totalPoints) {
    const percent = Math.min((totalPoints / WEEKLY_GOAL) * 100, 100);
    progressFill.style.width = `${percent}%`;
    progressLabel.innerText = `${totalPoints} / ${WEEKLY_GOAL} Points`;
  }


  let timerActive = false;
  let timerInterval;

  timerBtn.addEventListener("click", () => {
    if (timerActive) return;
    timerActive = true;

    // const totalSeconds = 45 * 60;
    const totalSeconds = 5; // quick test
    let remaining = totalSeconds;
    const timerDisplay = document.getElementById("focusTimer");

    feedback.innerText = "⏱ Focus session started (45 min)...";

    const alarm = new Audio(chrome.runtime.getURL("cardinal-37075.mp3"));
    alarm.volume = 0.7;
    alarm.load();

    function updateDisplay() {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      timerDisplay.innerText = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    updateDisplay();

    timerInterval = setInterval(() => {
      remaining--;
      updateDisplay();

      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerDisplay.innerText = "00:00";
        timerActive = false;
        feedback.innerText = "Session complete! +1 point earned.";

        alarm.play().catch(() => console.log("Audio play blocked by browser."));

        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.local.get(["points"], (data) => {
            const total = (data?.points || 0) + 1;
            chrome.storage.local.set({ points: total }, () => {
              updateProgress(total);
            });
          });
        }
      }
    }, 1000);
  });

  let hidden = false;
  distractionBtn.addEventListener("click", () => {
    hidden = !hidden;
    if (typeof chrome !== "undefined" && chrome.scripting && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (hide) => {
            const styleId = "earlybird-hide-style";
            if (hide) {
              const s = document.createElement("style");
              s.id = styleId;
              s.textContent = "#right-side, .ic-app-nav-toggle-and-crumbs__bar { visibility:hidden !important; }";
              document.head.appendChild(s);
            } else {
              document.getElementById(styleId)?.remove();
            }
          },
          args: [hidden]
        });
      });
    }
    feedback.innerText = hidden ? "Distractions hidden!" : "Distractions visible.";
  });

  if (typeof chrome !== "undefined" && chrome.storage) {
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
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  dailyTip.innerText = randomTip;
});
