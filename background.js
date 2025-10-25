const STORAGE = {
    SETTINGS: 'settings',
    EVENTS: 'events',        // normalized assignments/events
    LAST_SYNC: 'last_sync'
};

// Message entrypoint (manual sync)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'SYNC_ICS') {
        syncNow().then(() => sendResponse({ ok: true })).catch(e => sendResponse({ ok:false, error: String(e) }));
        return true;
    }
});

// Periodic refresh every ~3 hours, lighter overnight
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('refresh', { periodInMinutes: 180 });
});
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'refresh') syncNow().catch(()=>{});
});

// ---- Core ----
async function syncNow() {
    const { settings } = await chrome.storage.local.get(STORAGE.SETTINGS);
    if (!settings?.icsUrl) throw new Error('Missing ICS URL – set it in Options.');
    const icsText = await fetchIcs(settings.icsUrl);
    const events = parseICS(icsText);
    const now = new Date();
    const lookAheadDays = settings.lookAheadDays || 120;
    const end = new Date(now); end.setDate(end.getDate() + lookAheadDays);

    const upcoming = events
        .filter(e => e.dtstart && new Date(e.dtstart) <= end)
        .sort((a,b) => (a.dtstart||'').localeCompare(b.dtstart||''));

    await chrome.storage.local.set({
        [STORAGE.EVENTS]: upcoming,
        [STORAGE.LAST_SYNC]: new Date().toISOString()
    });
}

// Fetch ICS (most Canvas feeds are public-tokenized; host_permissions allows this)
async function fetchIcs(url) {
    const res = await fetch(url, { method: 'GET', credentials: 'omit' });
    if (!res.ok) throw new Error(`ICS fetch ${res.status}`);
    return await res.text();
}

// ---- Minimal RFC5545 parser for VEVENTs with line folding ----
function parseICS(text) {
    // unfold lines: lines starting with space/tab are continuations
    const rawLines = text.replace(/\r/g, '').split('\n');
    const lines = [];
    for (let i=0;i<rawLines.length;i++) {
        const line = rawLines[i];
        if (i>0 && (line.startsWith(' ') || line.startsWith('\t'))) {
            lines[lines.length-1] += line.slice(1);
        } else {
            lines.push(line);
        }
    }

    const events = [];
    let inEvent = false;
    let cur = {};
    for (const ln of lines) {
        if (ln === 'BEGIN:VEVENT') { inEvent = true; cur = {}; continue; }
        if (ln === 'END:VEVENT')   { inEvent = false; events.push(normalizeEvent(cur)); cur = {}; continue; }
        if (!inEvent) continue;

        const idx = ln.indexOf(':');
        if (idx === -1) continue;
        const prop = ln.slice(0, idx);          // e.g., DTSTART;TZID=America/New_York
        const val  = ln.slice(idx + 1);
        const key = prop.split(';')[0].toUpperCase();

        switch (key) {
            case 'SUMMARY':       cur.summary = val; break;
            case 'DESCRIPTION':   cur.description = val; break;
            case 'DTSTART':       cur.dtstart = parseICSTime(prop, val); break;
            case 'DTEND':         cur.dtend = parseICSTime(prop, val); break;
            case 'URL':           cur.url = val; break;
            case 'LOCATION':      cur.location = val; break;
            case 'UID':           cur.uid = val; break;
            default: break;
        }
    }
    return events;
}

function parseICSTime(prop, val) {
    // Handles Zulu (UTC) like 20251022T235900Z or floating/local like 20251022T235900
    // If TZID exists in prop, keep as-is but convert to ISO using Date parsing heuristics.
    // Canvas usually emits UTC Z times.
    if (/\d{8}T\d{6}Z/.test(val)) return new Date(val.replace('Z','Z')).toISOString();
    if (/\d{8}T\d{6}/.test(val)) {
        // treat as local time; convert to ISO
        const y = val.slice(0,4), m = val.slice(4,6), d = val.slice(6,8), hh = val.slice(9,11), mm = val.slice(11,13), ss = val.slice(13,15);
        const dt = new Date(Number(y), Number(m)-1, Number(d), Number(hh), Number(mm), Number(ss));
        return dt.toISOString();
    }
    if (/\d{8}/.test(val)) { // all-day
        const y = val.slice(0,4), m = val.slice(4,6), d = val.slice(6,8);
        return new Date(Number(y), Number(m)-1, Number(d)).toISOString();
    }
    // fallback
    const t = new Date(val);
    return isNaN(t.getTime()) ? null : t.toISOString();
}

function normalizeEvent(e) {
    // Try to pull course + assignment URLs from DESCRIPTION/URL
    const url = e.url || extractFirstUrl(e.description);
    const courseMatch = url?.match(/\/courses\/(\d+)/);
    const assignMatch = url?.match(/\/assignments\/(\d+)/) || url?.match(/\/quizzes\/(\d+)/);

    const courseName = inferCourseFromSummary(e.summary) || inferCourseFromDescription(e.description);

    return {
        uid: e.uid || url || e.summary,
        title: stripCourseFromSummary(e.summary),
        dtstart: e.dtstart || null,
        dtend: e.dtend || null,
        html_url: url || null,
        course_id: courseMatch ? Number(courseMatch[1]) : null,
        assignment_id: assignMatch ? Number(assignMatch[1]) : null,
        course_name: courseName || 'Course',
        raw_summary: e.summary || '',
        raw_description: e.description || ''
    };
}

function extractFirstUrl(txt) {
    if (!txt) return null;
    const m = txt.match(/https?:\/\/[^\s]+/);
    return m ? m[0] : null;
}
function inferCourseFromSummary(s) {
    if (!s) return null;
    // Heuristic: "[COURSE] Title" or "COURSE: Title"
    const m = s.match(/^\s*\[?([A-Z]{2,}\s*\d{3,}[A-Z]?)\]?\s*[:\-–]\s*/);
    return m ? m[1] : null;
}
function stripCourseFromSummary(s) {
    if (!s) return s || '';
    return s.replace(/^\s*\[?([^\]]{2,20})\]?\s*[:\-–]\s*/,'').trim();
}
function inferCourseFromDescription(d) {
    if (!d) return null;
    const m = d.match(/Course:\s*([^\n]+)/i);
    return m ? m[1].trim() : null;
}
