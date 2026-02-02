let activeModal = null;
let lastBodyOverflow = null;
let lastFocusedElement = null;

const MODAL_BACKDROP_CLASS = "modal-backdrop";
let modalId = 0;

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
  backdrop.setAttribute("role", "presentation");

  const dialog = document.createElement("div");
  dialog.className = "modal";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("tabindex", "-1");

  const header = document.createElement("header");
  header.className = "modal-header";

  const heading = document.createElement("h2");
  heading.textContent = title || "";
  const headingId = `modal-title-${++modalId}`;
  heading.id = headingId;
  dialog.setAttribute("aria-labelledby", headingId);

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

  backdrop._dialog = dialog;
  backdrop._closeBtn = closeBtn;

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });

  return backdrop;
}

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      "a[href], button, textarea, input, select, [tabindex]:not([tabindex='-1'])",
    ),
  ).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
  );
}

function handleKeydown(event) {
  if (!activeModal) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key !== "Tab") return;

  const dialog = activeModal._dialog;
  const focusable = getFocusableElements(dialog);
  if (!focusable.length) {
    event.preventDefault();
    dialog?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const isShift = event.shiftKey;

  if (isShift && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!isShift && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function openModal({ title = "", contentHTML = "" } = {}) {
  closeModal();
  const modalEl = buildModal({ title, contentHTML });
  lastFocusedElement = document.activeElement;
  document.body.appendChild(modalEl);
  activeModal = modalEl;
  lockScroll();
  document.addEventListener("keydown", handleKeydown);

  const focusTarget = modalEl._closeBtn || modalEl._dialog;
  if (focusTarget) {
    focusTarget.focus();
  }
}

export function closeModal() {
  if (activeModal && activeModal.parentElement) {
    activeModal.parentElement.removeChild(activeModal);
  }
  activeModal = null;
  unlockScroll();
  document.removeEventListener("keydown", handleKeydown);
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}
