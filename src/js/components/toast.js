const TOAST_CONTAINER_CLASS = "toast-container";
const TOAST_CLASS = "toast";

let toastContainer = null;

function ensureContainer() {
  if (toastContainer) return toastContainer;
  const container = document.createElement("div");
  container.className = TOAST_CONTAINER_CLASS;
  container.setAttribute("role", "status");
  document.body.appendChild(container);
  toastContainer = container;
  return container;
}

export function showToast(message, type = "success", duration = 2500) {
  if (!message) return;
  const container = ensureContainer();
  const toast = document.createElement("div");
  toast.className = `${TOAST_CLASS} ${TOAST_CLASS}-${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-exiting");
    toast.addEventListener(
      "transitionend",
      () => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      },
      { once: true },
    );
  }, duration);
}
