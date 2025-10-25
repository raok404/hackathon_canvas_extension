const style = document.createElement("style");
style.textContent = `
  #right-side {
    visibility: hidden !important;
  }
`;
// trying to inject as iframe
const iframe = document.createElement("iframe");
iframe.src = chrome.runtime.getURL("../sidebar.html");
iframe.style.width = "250px";
iframe.style.height = "100%";

const target = document.getElementById("right-side");
if (target) {
  target.replaceWith(iframe);
}
//

const now = new Date().toISOString();
chrome.storage.local.set({test: now }, () => {
  console.log(`Extension reloaded at ${now}`);
});

async function loadData() {
  chrome.storage.local.get("test")
    .then((result) => {
      console.log("Got data:", result.test);
    })
    .catch((error) => {
      console.error("Error getting data:", error);
    })
}

loadData()