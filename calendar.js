
function renderCalendar(){
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    document.getElementById('month-year').textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';

    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        if (day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
            dayDiv.classList.add('current-day');
        }
        calendarGrid.appendChild(dayDiv);
    }
}
async function getAssignments() {
    const storedAssignments = await chrome.storage.local.get("assignments") || {};
    let storedList = storedAssignments.assignments.assignmentList;
    let unsubmittedAssignments = [];
    console.log(storedList);
    for (let i = 0; i < storedList.length; i++){
        for (let key in storedList[i]){
            if (storedList[i].hasOwnProperty(key)){
                const value = storedList[i][key];
                if (value == "unsubmitted") {
                    unsubmittedAssignments.push(storedList[i]);
                }
            }
        }
    }
    console.log(unsubmittedAssignments);

}

getAssignments();
renderCalendar();
