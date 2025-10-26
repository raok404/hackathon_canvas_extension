document.addEventListener("DOMContentLoaded", () => {
  console.log("Timer page loaded");
  const timerDisplay = document.getElementById("timerDisplay");
  const startBtn = document.getElementById("startBtn");
  const confettiCanvas = document.getElementById("confetti");
  const ctx = confettiCanvas.getContext("2d");

  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  let running = false;
  let particles = [];
  let timerInterval;
  const duration = 5; // change to 45 * 60 for real use
  let remaining = duration;

  const alarm = new Audio(chrome.runtime.getURL("scripts/cardinal-37075.mp3"));
  alarm.volume = 0.8;

  function updateDisplay() {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function startTimer() {
    if (running) return;
    running = true;
    startBtn.disabled = true;

    timerInterval = setInterval(() => {
      remaining--;
      updateDisplay();

      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerDisplay.textContent = "00:00";
        running = false;
        alarm.play().catch(err => console.log("Audio blocked:", err));
        launchConfetti();
        awardFocusPoint();
      }
    }, 1000);
  }

  function awardFocusPoint() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get("points", (data) => {
        const total = (data.points || 0) + 1;
        chrome.storage.local.set({ points: total }, () => {
          console.log("🌟 +1 Focus Point added! Total:", total);
          showRewardMessage();
          chrome.runtime.sendMessage(
            { action: "updateProgress", totalPoints: total },
            (response) => console.log("Sent to background:", response)
          );
        });
      });
    }
  }

  function showRewardMessage() {
    const msg = document.createElement("div");
    msg.innerText = "Great job! +1 Focus Point earned!";
    Object.assign(msg.style, {
      position: "absolute",
      top: "40%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#f59e0b",
      color: "#fff",
      padding: "14px 20px",
      borderRadius: "10px",
      fontWeight: "600",
      fontSize: "18px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      zIndex: "9999"
    });
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3500);
  }

  function launchConfetti() {
    const colors = ["#f59e0b", "#f97316", "#ffbf00", "#ffd700"];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        speed: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.1 - 0.05
      });
    }

    function animate() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        p.y += p.speed;
        p.x += Math.sin(p.angle) * 2;
        p.angle += p.spin;
        if (p.y > confettiCanvas.height) p.y = -10;
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  updateDisplay();
  startBtn.addEventListener("click", startTimer);
});
