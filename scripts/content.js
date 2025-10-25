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
fetch(`${domain}/api/v1/courses/544016/activity_stream/summary`, {
  method: "GET",
  credentials: "include"
})
  .then(resp => resp.json())
  .then(data => {console.log("fetched data:", data)})
  .catch(err => console.error("Error:", err));
