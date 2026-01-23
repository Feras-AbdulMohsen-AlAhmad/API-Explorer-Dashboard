let activeModal = null;
let lastBodyOverflow = null;

const MODAL_BACKDROP_CLASS = "modal-backdrop";

function lockScroll() {
  if (lastBodyOverflow !== null) return;
  lastBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  if (lastBodyOverflow === null) return;
  document.body.style.overflow = lastBodyOverflow;
  lastBodyOverflow = null;
}

function buildModal({ title, contentHTML }) {
  const backdrop = document.createElement("div");
  backdrop.className = MODAL_BACKDROP_CLASS;
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");

  const dialog = document.createElement("div");
  dialog.className = "modal";

  const header = document.createElement("header");
  header.className = "modal-header";

  const heading = document.createElement("h2");
  heading.textContent = title || "";

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-ghost modal-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.textContent = "✕";

  header.append(heading, closeBtn);

  const body = document.createElement("div");
  body.className = "modal-body";
  body.innerHTML = contentHTML || "";

  dialog.append(header, body);
  backdrop.appendChild(dialog);

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });

  return backdrop;
}

function onEsc(event) {
  if (event.key === "Escape") {
    closeModal();
  }
}

export function openModal({ title = "", contentHTML = "" } = {}) {
  closeModal();
  const modalEl = buildModal({ title, contentHTML });
  document.body.appendChild(modalEl);
  activeModal = modalEl;
  lockScroll();
  document.addEventListener("keydown", onEsc);
}

export function closeModal() {
  if (activeModal && activeModal.parentElement) {
    activeModal.parentElement.removeChild(activeModal);
  }
  activeModal = null;
  unlockScroll();
  document.removeEventListener("keydown", onEsc);
}
