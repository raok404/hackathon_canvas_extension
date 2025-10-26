
// function renderCalendar(){
//     const now = new Date();
//     const currentMonth = now.getMonth();
//     const currentYear = now.getFullYear();

//     document.getElementById('month-year').textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);

//     const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
//     const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

//     const calendarGrid = document.getElementById('calendar-grid');
//     calendarGrid.innerHTML = '';

//     for (let i = 0; i < firstDayOfMonth; i++) {
//         calendarGrid.appendChild(document.createElement('div'));
//     }

//     for (let day = 1; day <= daysInMonth; day++) {
//         const dayDiv = document.createElement('div');
//         dayDiv.textContent = day;
//         if (day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
//             dayDiv.classList.add('current-day');
//         }
//         calendarGrid.appendChild(dayDiv);
//     }
// }

function renderCalendar(assignments) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  document.getElementById('month-year').textContent =
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarGrid = document.getElementById('calendar-grid');
  calendarGrid.innerHTML = '';

  // Add empty placeholders before the first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.appendChild(document.createElement('div'));
  }

  // Loop through all days in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.textContent = day;

    // Highlight today's date
    if (day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
      dayDiv.classList.add('current-day');
    }

    // Check if any assignment is due on this day
    const hasAssignment = assignments.some(a => {

      const due = new Date(a.dueDate);
    console.log("Checking due:", a.dueDate, "→ parsed:", due);
      return (
        due.getDate() === day &&
        due.getMonth() === currentMonth &&
        due.getFullYear() === currentYear
      );
    });

    if (hasAssignment) {
      const dot = document.createElement('span');
      dot.classList.add('due-dot');
      dayDiv.appendChild(dot);
    }

    calendarGrid.appendChild(dayDiv);
  }
}

async function getAssignments() {
    const storedAssignments = await chrome.storage.local.get("assignments") || {};
    let storedList = storedAssignments.assignments.assignmentList;
    let unsubmittedAssignments = [];
    for (a of storedList){
        if (a.submissionState == "unsubmitted") {
            unsubmittedAssignments.push(a)
        }
    }
    console.log(unsubmittedAssignments);
    return unsubmittedAssignments;

}

// getAssignments();
// renderCalendar();

(async () => {
  const assignments = await getAssignments();
  renderCalendar(assignments);
})();
