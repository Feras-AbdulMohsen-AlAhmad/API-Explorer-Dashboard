function setActiveLink() {
  const current = window.location.hash || "#posts";
  const links = document.querySelectorAll(".nav-links a");
  links.forEach((link) => {
    const isActive = link.getAttribute("href") === current;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

export function initNavbar() {
  setActiveLink();
  window.addEventListener("hashchange", setActiveLink);
}
