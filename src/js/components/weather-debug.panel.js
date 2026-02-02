// Dev-only weather debug panel UI
import {
  getWeatherDebugStats,
  resetWeatherDebugStats,
} from "../state/weather.debug.js";

function isDevMode() {
  return window.__DEV__ === true || window.location.hostname === "localhost";
}

/**
 * Render weather debug panel into a container (dev only)
 * @param {HTMLElement} container - Target container element
 */
export function renderWeatherDebugPanel(container) {
  if (!container) return;

  if (!isDevMode()) {
    container.innerHTML = "";
    return;
  }

  const stats = getWeatherDebugStats();
  const lastFetchText = stats.lastFetchTime
    ? new Date(stats.lastFetchTime).toLocaleString()
    : "—";

  container.innerHTML = `
    <div class="debug-panel">
      <div class="debug-panel__title">Weather API Debug (Dev)</div>
      <div class="debug-panel__item">Network requests: ${stats.networkRequests}</div>
      <div class="debug-panel__item">Cache hits: ${stats.cacheHits}</div>
      <div class="debug-panel__item">Deduplicated requests: ${stats.deduplicatedRequests}</div>
      <div class="debug-panel__item">Last fetch time: ${lastFetchText}</div>
      <button class="debug-panel__reset" type="button">Reset stats</button>
    </div>
  `;

  const resetBtn = container.querySelector(".debug-panel__reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetWeatherDebugStats();
      renderWeatherDebugPanel(container);
    });
  }
}
