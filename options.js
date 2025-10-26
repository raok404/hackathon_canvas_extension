const KEY = 'settings';
const defaults = { icsUrl: '', lookAheadDays: 120 };

async function load() {
    const { settings } = await chrome.storage.local.get(KEY);
    const s = { ...defaults, ...(settings || {}) };
    document.getElementById('icsUrl').value = s.icsUrl || '';
    document.getElementById('lookAhead').value = String(s.lookAheadDays);
}
async function save() {
    const icsUrl = document.getElementById('icsUrl').value.trim();
    const lookAheadDays = parseInt(document.getElementById('lookAhead').value, 10) || 120;
    await chrome.storage.local.set({ [KEY]: { icsUrl, lookAheadDays } });
    document.getElementById('status').textContent = 'Saved!';
    setTimeout(()=>document.getElementById('status').textContent='', 1500);
    // kick an immediate sync
    chrome.runtime.sendMessage({ type: 'SYNC_ICS' });
}
document.getElementById('saveBtn').addEventListener('click', save);
load();
