// chrome.runtime.onInstalled.addListener( () => {
//     chrome.action.setBadgeText({
//         text: "OFF",
//     });
// });
console.log("Background service worker") //debugging

// initial setup on install of extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed or updated:", details.reason);
  if (details.reason === "install") {
    chrome.storage.local.set({ accessToken: false, streak: 0});
  }
});

const welcomePage = 'sidebar.html';
const mainPage = 'sidebar.html';
chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setOptions({ path: welcomePage });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const { path } = await chrome.sidePanel.getOptions({ tabId });
    if (path === welcomePage) {
        chrome.sidePanel.setOptions({ path: mainPage });
    }
});


chrome.storage.onChanged.addListener( (changes, local) => {
    console.log(changes)
}); // debugging
