function findElement() {
  const element = document.querySelector("#right-side");
  if (element) {
    console.log("Found immediately:", element);
    element.style.display = "none"
    return true;
  }
  return false;
}


const observer = new MutationObserver(() => {
  const element = document.querySelector("#right-side");
  if (element) {
    console.log("Found with mutation");
    element.style.display = "none"
    observer.disconnect(); // stop observing once found
  }
});
observer.observe(document.body, { childList: true, subtree: true });

