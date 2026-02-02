import {
  getCurrentByQuery,
  getCurrentByCoords,
  getCurrentByAutoIP,
} from "../services/weather.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";
import { isLoading } from "../state/loading.state.js";
import {
  saveLastWeatherState,
  getLastWeatherState,
  clearLastWeatherState,
} from "../state/weather.persistence.js";
import { renderWeatherDebugPanel } from "../components/weather-debug.panel.js";

const RECENT_SEARCHES_KEY = "weather_recent_searches";
const MAX_RECENT_SEARCHES = 5;
const MIN_SUGGESTION_LENGTH = 1;
const POPULAR_CITIES = [
  "London",
  "Paris",
  "Berlin",
  "Madrid",
  "Rome",
  "Amsterdam",
  "New York",
  "Tokyo",
  "Dubai",
  "Cairo",
];

/**
 * Get search history from localStorage
 * @returns {Array<string>} Array of recent searches (most-recent-first)
 */
function getRecentSearches() {
  try {
    const recent = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = recent ? JSON.parse(recent) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Add search to history, avoiding duplicates (dedupe)
 * @param {string} query - Search query
 */
function saveRecentSearch(query) {
  if (!query || query.trim().length === 0) return;

  const trimmed = query.trim();
  let recent = getRecentSearches();

  // Remove duplicates (case-insensitive)
  recent = recent.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );

  // Add to front (most-recent-first)
  recent.unshift(trimmed);

  // Keep only last 5
  recent = recent.slice(0, MAX_RECENT_SEARCHES);

  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  } catch (e) {
    // localStorage full or unavailable - silently fail
  }
}

/**
 * Filter suggestions from recent searches and popular cities
 * @param {string} inputValue - Current input value
 * @returns {Array<string>} Filtered suggestions (max 5)
 */
function filterSuggestions(inputValue) {
  if (!inputValue || inputValue.trim().length < MIN_SUGGESTION_LENGTH) {
    return [];
  }

  const lowerInput = inputValue.trim().toLowerCase();
  const recent = getRecentSearches();
  const merged = [...recent, ...POPULAR_CITIES];

  const unique = merged.filter((item, index, self) => {
    return (
      self.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) ===
      index
    );
  });

  const matches = unique.filter((item) => {
    const lowerItem = item.toLowerCase();
    return lowerItem.startsWith(lowerInput) || lowerItem.includes(lowerInput);
  });

  return matches.slice(0, 5);
}

export function renderWeatherPage(appEl) {
  if (!appEl) return;

  // Module-level state for retry functionality
  let lastAction = null; // { type: "query", query: string } | { type: "geo" } | { type: "ip" }
  let lastUnits = "m";

  appEl.innerHTML = `
    <section class="page weather-page">
      <div class="page-header">
        <div>
          <h1>Weather</h1>
          <p style="color: var(--color-muted);">Check current weather conditions worldwide using Weatherstack API.</p>
        </div>
      </div>
      <div class="section-block">
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; position: relative; align-items: center;">
            <div style="flex: 1; min-width: 200px; position: relative;">
              <input
                id="weather-search"
                class="input"
                type="text"
                placeholder="e.g., Amsterdam, NL"
                aria-label="Search for weather by city or country"
                autocomplete="off"
                style="width: 100%;"
              />
              <div
                id="weather-suggestions"
                class="search-suggestions"
                hidden
              ></div>
            </div>
            <div style="display: flex; gap: var(--space-2); align-items: center; white-space: nowrap;">
              <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer; user-select: none;">
                <input
                  id="weather-units-toggle"
                  type="checkbox"
                  style="cursor: pointer;"
                  title="Toggle between Metric and Fahrenheit"
                />
                <span id="weather-units-label" style="font-size: var(--font-size-sm); font-weight: 500;">Metric</span>
              </label>
              <button id="weather-search-btn" class="btn btn-primary">Search</button>
              <button id="weather-location-btn" class="btn btn-secondary">Use My Location</button>
            </div>
          </div>
          ${
            window.isSecureContext === false
              ? `<div style="color: var(--color-muted); font-size: var(--font-size-sm); padding: var(--space-2); background: var(--color-bg-secondary); border-radius: var(--radius);">
                  ⚠️ Geolocation may require HTTPS or localhost for security.
                </div>`
              : ""
          }
        </div>
      </div>
      <div id="weather-content" class="section-block"></div>
      <div id="weather-debug-panel"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#weather-content");
  const searchInput = appEl.querySelector("#weather-search");
  const searchBtn = appEl.querySelector("#weather-search-btn");
  const locationBtn = appEl.querySelector("#weather-location-btn");
  const unitsToggle = appEl.querySelector("#weather-units-toggle");
  const unitsLabel = appEl.querySelector("#weather-units-label");
  const suggestionsContainer = appEl.querySelector("#weather-suggestions");
  const debugPanelEl = appEl.querySelector("#weather-debug-panel");
  let suggestions = [];
  let activeSuggestionIndex = -1;

  // Initialize units from localStorage (default: metric)
  let currentUnits = localStorage.getItem("weather-units") || "m";
  lastUnits = currentUnits;
  unitsToggle.checked = currentUnits === "f";
  unitsLabel.textContent = currentUnits === "f" ? "Fahrenheit" : "Metric";

  // Listen for units toggle changes
  unitsToggle?.addEventListener("change", (e) => {
    currentUnits = e.target.checked ? "f" : "m";
    lastUnits = currentUnits;
    localStorage.setItem("weather-units", currentUnits);
    unitsLabel.textContent = currentUnits === "f" ? "Fahrenheit" : "Metric";
    showToast(
      `Switched to ${currentUnits === "f" ? "Fahrenheit" : "Metric"}`,
      "success",
    );
    // Refresh current weather if any is displayed
    const retryBtn = contentEl?.querySelector("#retry-btn");
    if (!retryBtn && contentEl?.querySelector(".weather-card")) {
      // Re-execute last action with new units
      if (lastAction) {
        handleRetry();
      }
    }
  });

  function renderWeatherCard(data) {
    if (!data || !data.current || !data.location) {
      contentEl.innerHTML = `
        <div class="state-empty">
          <h3>No weather data available</h3>
          <p>Try searching for a different location.</p>
        </div>
      `;
      return;
    }

    const { current, location } = data;
    // Display units based on current selection
    const tempUnit = currentUnits === "f" ? "°F" : "°C";
    const windUnit = currentUnits === "f" ? "mph" : "km/h";
    const distanceUnit = "km";

    // Helper to format values or show "—" for missing data
    const formatValue = (value, suffix = "") => {
      if (value === null || value === undefined || value === "") return "—";
      return `${value}${suffix}`;
    };

    contentEl.innerHTML = `
      <div style="display: grid; gap: var(--space-5);">
        <div class="card weather-card" style="padding: var(--space-6);">
          <div style="text-align: center; margin-bottom: var(--space-4);">
            <h2 style="margin: 0 0 var(--space-2);">${location.name}, ${location.country}</h2>
            <div style="color: var(--color-muted); font-size: var(--font-size-sm);">
              ${location.region ? location.region + " • " : ""}${location.timezone_id || "—"}
            </div>
            ${location.localtime ? `<div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-top: var(--space-1);">Local time: ${location.localtime}</div>` : ""}
          </div>

          ${
            current.weather_icons?.[0]
              ? `<div style="text-align: center; margin: var(--space-4) 0;">
                  <img src="${current.weather_icons[0]}" alt="Weather icon" style="width: 80px; height: 80px;" />
                </div>`
              : ""
          }

          <div style="text-align: center; margin: var(--space-4) 0;">
            <div style="font-size: 3.5rem; font-weight: 700;">
              ${formatValue(current.temperature, tempUnit)}
            </div>
            <div style="color: var(--color-muted); font-size: var(--font-size-lg); margin-top: var(--space-2);">
              ${current.weather_descriptions?.[0] || "Clear"}
            </div>
          </div>

          <div class="weather-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-top: var(--space-6);">
            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Feels Like</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${formatValue(current.feelslike, tempUnit)}</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Humidity</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${formatValue(current.humidity, "%")}</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Wind</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${formatValue(current.wind_speed, ` ${windUnit}`)} ${current.wind_dir || ""}</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Pressure</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${formatValue(current.pressure, " mb")}</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Visibility</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${formatValue(current.visibility, ` ${distanceUnit}`)}</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Precipitation</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${formatValue(current.precip, " mm")}</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">UV Index</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${formatValue(current.uv_index)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderEmptyState() {
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="state-empty">
        <h3>Search for Weather</h3>
        <p>Search for a city or use your location.</p>
      </div>
    `;
  }

  function renderError(error) {
    if (!contentEl) return;
    const title = error?.title || "Something went wrong";
    const message =
      error?.message || "An unexpected error occurred. Please try again.";
    contentEl.innerHTML = `
      <div class="state-error">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="actions" style="justify-content: center; margin-top: var(--space-4);">
          <button class="btn btn-primary" id="retry-btn">Retry</button>
        </div>
      </div>
    `;

    const retryBtn = contentEl.querySelector("#retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", handleRetry);
    }
  }

  function handleRetry() {
    if (!lastAction) {
      showToast("No previous action to retry", "error");
      return;
    }

    if (isLoading("weather")) {
      return;
    }

    switch (lastAction.type) {
      case "query":
        searchWeather(lastAction.query);
        break;
      case "coords":
        fetchCoordsWeather(lastAction.coords?.lat, lastAction.coords?.lon);
        break;
      case "geo":
        useGeolocation();
        break;
      case "ip":
        useIPLocation();
        break;
      default:
        showToast("Unknown action type", "error");
    }
  }

  function setActionsDisabled(disabled) {
    if (searchBtn) searchBtn.disabled = disabled;
    if (locationBtn) locationBtn.disabled = disabled;
  }

  function refreshDebugPanel() {
    if (!debugPanelEl) return;
    renderWeatherDebugPanel(debugPanelEl);
  }

  function applyUnits(units) {
    const resolved = units === "f" ? "f" : "m";
    currentUnits = resolved;
    lastUnits = resolved;
    unitsToggle.checked = resolved === "f";
    unitsLabel.textContent = resolved === "f" ? "Fahrenheit" : "Metric";
    localStorage.setItem("weather-units", resolved);
  }

  async function restoreLastState() {
    if (isLoading("weather")) return;

    const state = getLastWeatherState();
    if (!state) {
      renderEmptyState();
      return;
    }

    applyUnits(state.units);
    setActionsDisabled(true);
    showLoader(contentEl);

    try {
      let data;
      if (state.type === "query") {
        if (searchInput) searchInput.value = state.query;
        lastAction = { type: "query", query: state.query };
        data = await getCurrentByQuery(state.query, { units: state.units });
      } else if (state.type === "coords") {
        const { lat, lon } = state.coords;
        lastAction = { type: "coords", coords: { lat, lon } };
        data = await getCurrentByCoords(lat, lon, { units: state.units });
      } else {
        lastAction = { type: "ip" };
        data = await getCurrentByAutoIP({ units: state.units });
      }

      hideLoader();
      renderWeatherCard(data);
      showToast(
        `Weather for ${data.location.name} loaded successfully`,
        "success",
      );

      saveLastWeatherState({
        ...state,
        timestamp: Date.now(),
      });
    } catch (error) {
      hideLoader();
      clearLastWeatherState();
      renderEmptyState();
    } finally {
      setActionsDisabled(false);
      refreshDebugPanel();
    }
  }

  async function searchWeather(query) {
    if (!query || query.trim() === "") {
      showToast("Please enter a city or country name", "error");
      return;
    }

    if (!contentEl) return;

    if (isLoading("weather")) {
      return;
    }

    setActionsDisabled(true);

    closeSuggestions();

    // Store last action for retry
    lastAction = { type: "query", query: query.trim() };
    lastUnits = currentUnits;

    showLoader(contentEl);

    try {
      const data = await getCurrentByQuery(query, { units: currentUnits });
      hideLoader();
      renderWeatherCard(data);
      showToast(
        `Weather for ${data.location.name} loaded successfully`,
        "success",
      );
      // Save recent search after successful fetch
      saveRecentSearch(query);
      saveLastWeatherState({
        type: "query",
        query: query.trim(),
        units: currentUnits,
        timestamp: Date.now(),
      });
    } catch (error) {
      hideLoader();
      const normalized =
        error?.title && error?.message
          ? error
          : {
              title: "Something went wrong",
              message: "An unexpected error occurred. Please try again.",
            };
      showToast(normalized.title, "error");
      renderError(normalized);
    } finally {
      setActionsDisabled(false);
      refreshDebugPanel();
    }
  }

  async function fetchCoordsWeather(lat, lon) {
    if (typeof lat !== "number" || typeof lon !== "number") return;

    if (!contentEl) return;

    if (isLoading("weather")) {
      return;
    }

    setActionsDisabled(true);
    lastAction = { type: "coords", coords: { lat, lon } };
    lastUnits = currentUnits;

    showLoader(contentEl);

    try {
      const data = await getCurrentByCoords(lat, lon, { units: currentUnits });
      hideLoader();
      renderWeatherCard(data);
      showToast(
        `Weather for ${data.location.name} loaded successfully`,
        "success",
      );
      saveLastWeatherState({
        type: "coords",
        coords: { lat, lon },
        units: currentUnits,
        timestamp: Date.now(),
      });
    } catch (error) {
      hideLoader();
      const normalized =
        error?.title && error?.message
          ? error
          : {
              title: "Something went wrong",
              message: "An unexpected error occurred. Please try again.",
            };
      showToast(normalized.title, "error");
      renderError(normalized);
    } finally {
      setActionsDisabled(false);
      refreshDebugPanel();
    }
  }

  function openSuggestions() {
    if (suggestionsContainer) {
      suggestionsContainer.hidden = false;
    }
  }

  function closeSuggestions() {
    if (suggestionsContainer) {
      suggestionsContainer.hidden = true;
      suggestionsContainer.innerHTML = "";
    }
    suggestions = [];
    activeSuggestionIndex = -1;
  }

  function renderSuggestions(items) {
    if (!suggestionsContainer) return;

    if (!items || items.length === 0) {
      suggestionsContainer.innerHTML =
        '<div class="suggestion-empty">No suggestions</div>';
      openSuggestions();
      return;
    }

    suggestionsContainer.innerHTML = items
      .map((item, idx) => {
        const activeClass =
          idx === activeSuggestionIndex ? "suggestion-item--active" : "";
        return `
          <div
            data-index="${idx}"
            class="suggestion-item ${activeClass}"
          >
            ${item}
          </div>
        `;
      })
      .join("");

    openSuggestions();
  }

  function updateSuggestions() {
    const inputValue = searchInput?.value || "";
    if (inputValue.trim().length < MIN_SUGGESTION_LENGTH) {
      closeSuggestions();
      return;
    }

    suggestions = filterSuggestions(inputValue);
    activeSuggestionIndex = suggestions.length > 0 ? 0 : -1;
    renderSuggestions(suggestions);
  }

  function selectSuggestion(item) {
    if (!item || !searchInput) return;

    searchInput.value = item;
    closeSuggestions();
    searchWeather(item);
  }

  function moveSuggestion(direction) {
    if (!suggestions.length) return;

    const lastIndex = suggestions.length - 1;
    if (direction === "down") {
      activeSuggestionIndex =
        activeSuggestionIndex < lastIndex ? activeSuggestionIndex + 1 : 0;
    } else {
      activeSuggestionIndex =
        activeSuggestionIndex > 0 ? activeSuggestionIndex - 1 : lastIndex;
    }

    renderSuggestions(suggestions);
  }

  function useGeolocation() {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      // Fallback to IP-based location
      useIPLocation();
      return;
    }

    if (!contentEl) return;

    if (isLoading("weather")) {
      return;
    }

    setActionsDisabled(true);

    // Store last action for retry
    lastAction = { type: "geo" };
    lastUnits = currentUnits;

    showLoader(contentEl);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await getCurrentByCoords(latitude, longitude, {
            units: currentUnits,
          });
          hideLoader();
          renderWeatherCard(data);
          showToast(
            `Weather for ${data.location.name} loaded successfully`,
            "success",
          );
          saveLastWeatherState({
            type: "coords",
            coords: { lat: latitude, lon: longitude },
            units: currentUnits,
            timestamp: Date.now(),
          });
        } catch (error) {
          hideLoader();
          const normalized =
            error?.title && error?.message
              ? error
              : {
                  title: "Something went wrong",
                  message: "An unexpected error occurred. Please try again.",
                };
          showToast(normalized.title, "error");
          renderError(normalized);
        } finally {
          setActionsDisabled(false);
          refreshDebugPanel();
        }
      },
      (error) => {
        // Geolocation denied or failed - fallback to IP-based location
        if (error.code === 1) {
          showToast(
            "Location access denied. Fetching weather by IP address...",
            "info",
          );
          useIPLocation();
        } else {
          const errorMsg =
            {
              2: "Unable to retrieve your location. Fetching weather by IP address...",
              3: "Location request timed out. Fetching weather by IP address...",
            }[error.code] ||
            "Failed to get your location. Fetching weather by IP address...";

          showToast(errorMsg, "info");
          useIPLocation();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 600000, // 10 minutes
      },
    );
  }

  async function useIPLocation() {
    if (!contentEl) return;

    if (isLoading("weather")) {
      return;
    }

    setActionsDisabled(true);

    // Store last action for retry
    lastAction = { type: "ip" };
    lastUnits = currentUnits;

    showLoader(contentEl);

    try {
      const data = await getCurrentByAutoIP({ units: currentUnits });
      hideLoader();
      renderWeatherCard(data);
      showToast(
        `Weather for ${data.location.name} (based on IP location) loaded successfully`,
        "success",
      );
      saveLastWeatherState({
        type: "ip",
        units: currentUnits,
        timestamp: Date.now(),
      });
    } catch (error) {
      hideLoader();
      const normalized =
        error?.title && error?.message
          ? error
          : {
              title: "Something went wrong",
              message: "An unexpected error occurred. Please try again.",
            };
      showToast(normalized.title, "error");
      renderError(normalized);
    } finally {
      setActionsDisabled(false);
      refreshDebugPanel();
    }
  }

  searchBtn?.addEventListener("click", () => {
    const query = searchInput?.value?.trim();
    closeSuggestions();
    searchWeather(query);
  });

  searchInput?.addEventListener("focus", () => {
    if (searchInput.value.trim().length >= MIN_SUGGESTION_LENGTH) {
      updateSuggestions();
    }
  });

  searchInput?.addEventListener("keydown", (e) => {
    const isOpen = suggestionsContainer && !suggestionsContainer.hidden;

    if (e.key === "ArrowDown") {
      if (isOpen) {
        e.preventDefault();
        moveSuggestion("down");
      }
      return;
    }

    if (e.key === "ArrowUp") {
      if (isOpen) {
        e.preventDefault();
        moveSuggestion("up");
      }
      return;
    }

    if (e.key === "Enter") {
      if (isOpen && activeSuggestionIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        const query = searchInput.value.trim();
        closeSuggestions();
        searchWeather(query);
      }
      return;
    }

    if (e.key === "Escape") {
      closeSuggestions();
    }
  });

  searchInput?.addEventListener("input", () => {
    updateSuggestions();
  });

  suggestionsContainer?.addEventListener("click", (e) => {
    const target = e.target.closest(".suggestion-item");
    if (!target) return;
    const index = Number(target.getAttribute("data-index"));
    if (Number.isNaN(index)) return;
    selectSuggestion(suggestions[index]);
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !searchInput?.contains(e.target) &&
      !suggestionsContainer?.contains(e.target)
    ) {
      closeSuggestions();
    }
  });

  locationBtn?.addEventListener("click", useGeolocation);

  // Render debug panel (dev only)
  refreshDebugPanel();

  // Restore last state (once) or show empty state
  restoreLastState();
}
