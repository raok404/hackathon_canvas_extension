async function loadData() {
  chrome.storage.local.get("streak")
    .then((result) => {
      console.log("Got data:", result.streak);
      const newP = document.createElement("p");
      newP.textContent = result.streak
      document.body.appendChild(newP)
    })
    .catch((error) => {
      console.error("Error getting data:", error);
    })
}

loadData()