import {
  getCurrentByQuery,
  getCurrentByCoords,
  getCurrentByAutoIP,
} from "../services/weather.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";

const DEBOUNCE_MS = 250; // 250-300ms debounce for local autocomplete
const MIN_SEARCH_LENGTH = 2; // Minimum 2 characters for suggestions
const MAX_SEARCH_HISTORY = 10; // Store last 10 searches
const SEARCH_HISTORY_KEY = "weather-search-history";

/**
 * Get search history from localStorage
 * @returns {Array<string>} Array of recent searches (most-recent-first)
 */
function getSearchHistory() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Add search to history, avoiding duplicates (dedupe)
 * @param {string} query - Search query
 */
function addToSearchHistory(query) {
  if (!query || query.trim().length < 2) return;

  const trimmed = query.trim();
  let history = getSearchHistory();

  // Remove if already exists (dedupe)
  history = history.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );

  // Add to front (most-recent-first)
  history.unshift(trimmed);

  // Keep only last 10
  history = history.slice(0, MAX_SEARCH_HISTORY);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    // localStorage full or unavailable - silently fail
  }
}

/**
 * Clear all search history
 */
function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (e) {
    // silently fail
  }
}

/**
 * Filter search history by query (case-insensitive partial match)
 * @param {string} query - Search query
 * @returns {Array<string>} Matching searches
 */
function filterSearchHistory(query) {
  if (!query || query.trim().length < MIN_SEARCH_LENGTH) return [];

  const lowerQuery = query.trim().toLowerCase();
  return getSearchHistory().filter((item) =>
    item.toLowerCase().includes(lowerQuery),
  );
}

export function renderWeatherPage(appEl) {
  if (!appEl) return;

  appEl.innerHTML = `
    <section class="page">
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
                placeholder="Enter city name or country..."
                aria-label="Search for weather by city or country"
                autocomplete="off"
                style="width: 100%;"
              />
              <div
                id="weather-suggestions"
                style="
                  display: none;
                  position: absolute;
                  top: 100%;
                  left: 0;
                  right: 0;
                  background: white;
                  border: 1px solid var(--color-border);
                  border-top: none;
                  border-radius: 0 0 var(--radius) var(--radius);
                  max-height: 300px;
                  overflow-y: auto;
                  z-index: 100;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                "
              ></div>
            </div>
            <div style="display: flex; gap: var(--space-2); align-items: center; white-space: nowrap;">
              <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer; user-select: none;">
                <input
                  id="weather-units-toggle"
                  type="checkbox"
                  style="cursor: pointer;"
                  title="Toggle between Celsius and Fahrenheit"
                />
                <span id="weather-units-label" style="font-size: var(--font-size-sm); font-weight: 500;">Celsius</span>
              </label>
              <button id="weather-search-btn" class="btn btn-primary">Search</button>
              <button id="weather-location-btn" class="btn btn-secondary">Use My Location</button>
            </div>
          </div>
        </div>
      </div>
      <div id="weather-content" class="section-block"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#weather-content");
  const searchInput = appEl.querySelector("#weather-search");
  const searchBtn = appEl.querySelector("#weather-search-btn");
  const locationBtn = appEl.querySelector("#weather-location-btn");
  const unitsToggle = appEl.querySelector("#weather-units-toggle");
  const unitsLabel = appEl.querySelector("#weather-units-label");
  const suggestionsContainer = appEl.querySelector("#weather-suggestions");
  let debounceTimer;
  let suggestions = [];

  // Initialize units from localStorage (default: metric/Celsius)
  let currentUnits = localStorage.getItem("weather-units") || "m";
  unitsToggle.checked = currentUnits === "f";
  unitsLabel.textContent = currentUnits === "f" ? "Fahrenheit" : "Celsius";

  // Listen for units toggle changes
  unitsToggle?.addEventListener("change", (e) => {
    currentUnits = e.target.checked ? "f" : "m";
    localStorage.setItem("weather-units", currentUnits);
    unitsLabel.textContent = currentUnits === "f" ? "Fahrenheit" : "Celsius";
    showToast(
      `Switched to ${currentUnits === "f" ? "Fahrenheit" : "Celsius"}`,
      "success",
    );
    // Refresh current weather if any is displayed
    const retryBtn = contentEl?.querySelector("#retry-btn");
    if (!retryBtn && contentEl?.querySelector(".card")) {
      const query = searchInput?.value?.trim();
      if (query) {
        searchWeather(query);
      }
    }
  });

  function renderWeatherCard(data) {
    if (!data || !data.current || !data.location) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <h3>No weather data available</h3>
          <p>Try searching for a different location.</p>
        </div>
      `;
      return;
    }

    const { current, location } = data;
    // Display units based on current selection
    const tempUnit = currentUnits === "f" ? "°F" : "°C";
    const windUnit = currentUnits === "f" ? "mph" : "m/s";

    contentEl.innerHTML = `
      <div style="display: grid; gap: var(--space-5);">
        <div class="card" style="padding: var(--space-6);">
          <div style="text-align: center; margin-bottom: var(--space-4);">
            <h2 style="margin: 0 0 var(--space-2);">${location.name}, ${location.country}</h2>
            <div style="color: var(--color-muted); font-size: var(--font-size-sm);">
              ${location.region ? location.region + ", " : ""}${location.timezone_id}
            </div>
          </div>

          <div style="text-align: center; margin: var(--space-6) 0;">
            <div style="font-size: 3.5rem; font-weight: 700;">
              ${current.temperature}${tempUnit}
            </div>
            <div style="color: var(--color-muted); font-size: var(--font-size-lg); margin-top: var(--space-2);">
              ${current.weather_descriptions?.[0] || "Clear"}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-top: var(--space-6);">
            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Feels Like</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${current.feelslike}${tempUnit}</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Humidity</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${current.humidity}%</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Wind Speed</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${current.wind_speed} ${windUnit}</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Pressure</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${current.pressure} mb</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Visibility</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${current.visibility} km</div>
            </div>

            <div style="padding: var(--space-3); background: var(--color-bg-secondary); border-radius: var(--radius);">
              <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">UV Index</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600;">${current.uv_index || "N/A"}</div>
            </div>
          </div>

          <div style="margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">
            <div style="color: var(--color-muted); font-size: var(--font-size-sm);">
              Last updated: ${new Date(current.observation_time).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderError(message) {
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="error-state">
        <h3>Unable to Load Weather</h3>
        <p>${message}</p>
        <div class="actions" style="justify-content: center; margin-top: var(--space-4);">
          <button class="btn btn-primary" id="retry-btn">Try Again</button>
        </div>
      </div>
    `;

    const retryBtn = contentEl.querySelector("#retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        const query = searchInput?.value?.trim();
        if (query) {
          searchWeather(query);
        }
      });
    }
  }

  async function searchWeather(query) {
    if (!query || query.trim() === "") {
      showToast("Please enter a city or country name", "error");
      return;
    }

    if (!contentEl) return;
    showLoader(contentEl);

    try {
      const data = await getCurrentByQuery(query, { units: currentUnits });
      hideLoader();
      renderWeatherCard(data);
      showToast(
        `Weather for ${data.location.name} loaded successfully`,
        "success",
      );
      // Add to search history after successful search
      addToSearchHistory(query);
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load weather data";
      showToast(message, "error");
      renderError(message);
    }
  }

  function renderSuggestions(items) {
    if (!suggestionsContainer) return;

    if (!items || items.length === 0) {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
      return;
    }

    suggestionsContainer.innerHTML = items
      .map(
        (item, idx) => `
      <div
        data-index="${idx}"
        class="suggestion-item"
        style="
          padding: var(--space-3);
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        "
        onmouseover="this.style.backgroundColor = 'var(--color-bg-secondary)';"
        onmouseout="this.style.backgroundColor = 'transparent';"
      >
        <span style="color: var(--color-muted); font-size: var(--font-size-sm);">🕐</span>
        <span style="font-weight: 500;">${item}</span>
      </div>
    `,
      )
      .join("");

    // Add clear history button if there are items
    if (items.length > 0) {
      suggestionsContainer.innerHTML += `
        <div style="
          padding: var(--space-2) var(--space-3);
          border-top: 1px solid var(--color-border);
          text-align: center;
        ">
          <button id="clear-history-btn" style="
            background: none;
            border: none;
            color: var(--color-muted);
            cursor: pointer;
            font-size: var(--font-size-sm);
            text-decoration: underline;
            padding: var(--space-1) 0;
          ">
            Clear recent searches
          </button>
        </div>
      `;
    }

    suggestionsContainer.style.display = "block";

    // Add click handlers to suggestion items
    suggestionsContainer
      .querySelectorAll(".suggestion-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const index = parseInt(item.getAttribute("data-index"), 10);
          selectSuggestion(suggestions[index]);
        });
      });

    // Add clear history handler
    const clearBtn = suggestionsContainer.querySelector("#clear-history-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearSearchHistory();
        suggestions = [];
        suggestionsContainer.style.display = "none";
        suggestionsContainer.innerHTML = "";
        showToast("Recent searches cleared", "success");
      });
    }
  }

  function selectSuggestion(item) {
    if (!item || !searchInput) return;

    searchInput.value = item;
    suggestionsContainer.style.display = "none";
    suggestionsContainer.innerHTML = "";
    suggestions = [];

    // Search with the selected item
    searchWeather(item);
  }

  async function fetchSuggestions(query) {
    if (!query || query.trim().length < MIN_SEARCH_LENGTH) {
      // Show all recent searches if input is empty or minimal
      if (query.trim().length === 0) {
        const allHistory = getSearchHistory();
        suggestions = allHistory;
        renderSuggestions(allHistory);
        return;
      }
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
      suggestions = [];
      return;
    }

    // Filter history based on query (no API calls - local only)
    const items = filterSearchHistory(query);
    suggestions = items;
    renderSuggestions(items);
  }

  function useGeolocation() {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      // Fallback to IP-based location
      useIPLocation();
      return;
    }

    if (!contentEl) return;
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
        } catch (error) {
          hideLoader();
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load weather data";
          showToast(message, "error");
          renderError(message);
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
          hideLoader();
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
    );
  }

  async function useIPLocation() {
    if (!contentEl) return;
    showLoader(contentEl);

    try {
      const data = await getCurrentByAutoIP({ units: currentUnits });
      hideLoader();
      renderWeatherCard(data);
      showToast(
        `Weather for ${data.location.name} (based on IP location) loaded successfully`,
        "success",
      );
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load weather data";
      showToast(message, "error");
      renderError(message);
    }
  }

  searchBtn?.addEventListener("click", () => {
    const query = searchInput?.value?.trim();
    searchWeather(query);
  });

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      suggestionsContainer.style.display = "none";
      searchWeather(query);
    }
    if (e.key === "Escape") {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
      suggestions = [];
    }
  });

  searchInput?.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (query.length < MIN_SEARCH_LENGTH) {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
      suggestions = [];
      return;
    }

    debounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, DEBOUNCE_MS);
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !searchInput?.contains(e.target) &&
      !suggestionsContainer?.contains(e.target)
    ) {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
      suggestions = [];
    }
  });

  locationBtn?.addEventListener("click", useGeolocation);

  // Show initial empty state
  contentEl.innerHTML = `
    <div class="empty-state">
      <h3>Search for Weather</h3>
      <p>Enter a city name or country to get current weather, or use your location.</p>
    </div>
  `;
}
