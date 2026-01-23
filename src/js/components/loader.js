let activeLoader = null;

const LOADER_CLASS = "loader-overlay";

function buildLoader() {
  const overlay = document.createElement("div");
  overlay.className = LOADER_CLASS;
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");

  const spinner = document.createElement("div");
  spinner.className = "loader-spinner";
  spinner.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "loader-label";
  label.textContent = "Loading...";

  overlay.append(spinner, label);
  return overlay;
}

export function showLoader(targetEl = document.body) {
  if (!targetEl) return;
  hideLoader();
  const loader = buildLoader();
  const host = targetEl;
  host.appendChild(loader);
  activeLoader = loader;
}

export function hideLoader() {
  if (activeLoader && activeLoader.parentElement) {
    activeLoader.parentElement.removeChild(activeLoader);
  }
  activeLoader = null;
}
