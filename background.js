// chrome.runtime.onInstalled.addListener( () => {
//     chrome.action.setBadgeText({
//         text: "OFF",
//     });
// });
const welcomePage = 'sidebar.html';
const mainPage = 'sidebar.html';
chrome.runtime.onInstalled.addListener((details) => {
    chrome.sidePanel.setOptions({ path: welcomePage });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    //initialize local storage on extension installation
    console.log("Extension installed or updated:", details.reason);//debugging
    if (details.reason === "install") {
        chrome.storage.local.set({assignments: {}, streak: 0, points: 0, classes:{}});
    }

});


chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const { path } = await chrome.sidePanel.getOptions({ tabId });
    if (path === welcomePage) {
        chrome.sidePanel.setOptions({ path: mainPage });
    }
});
