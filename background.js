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
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const { path } = await chrome.sidePanel.getOptions({ tabId });
    if (path === welcomePage) {
        chrome.sidePanel.setOptions({ path: mainPage });
    }
});