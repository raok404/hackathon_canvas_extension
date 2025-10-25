const observer = new MutationObserver(() => {
  const element = document.querySelector("#right-side");
  if (element) {
    console.log("Found");
    element.style.display = "none"
    observer.disconnect(); // stop observing once found
  }
});
observer.observe(document.body, { childList: true, subtree: true });
