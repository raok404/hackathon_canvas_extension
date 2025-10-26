// chrome.runtime.onInstalled.addListener( () => {
//     chrome.action.setBadgeText({
//         text: "OFF",
//     });
// });
const welcomePage = 'sidebar.html';
const mainPage = 'sidebar.html';
chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setOptions({ path: welcomePage });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    //initialize local storage on extension installation
    chrome.storage.local.set({assignments: {}});
    chrome.storage.local.set({streak:0});
    chrome.storage.local.set({points:0});
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const { path } = await chrome.sidePanel.getOptions({ tabId });
    if (path === welcomePage) {
        chrome.sidePanel.setOptions({ path: mainPage });
    }
});
