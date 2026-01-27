import {
  getCurrentByQuery,
  getCurrentByCoords,
  getLocationSuggestions,
} from "../services/weather.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";

const DEBOUNCE_MS = 300;

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
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; position: relative;">
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
            <button id="weather-search-btn" class="btn btn-primary">Search</button>
            <button id="weather-location-btn" class="btn btn-secondary">Use My Location</button>
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
  const suggestionsContainer = appEl.querySelector("#weather-suggestions");
  let debounceTimer;
  let suggestions = [];

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
    const tempUnit = current.temperature ? "°C" : "°F";
    const windUnit = current.wind_speed ? "m/s" : "mph";

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
      const data = await getCurrentByQuery(query);
      hideLoader();
      renderWeatherCard(data);
      showToast(
        `Weather for ${data.location.name} loaded successfully`,
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
        "
        onmouseover="this.style.backgroundColor = 'var(--color-bg-secondary)';"
        onmouseout="this.style.backgroundColor = 'transparent';"
      >
        <div style="font-weight: 500;">${item.display}</div>
        <div style="font-size: var(--font-size-sm); color: var(--color-muted); margin-top: 4px;">
          ${item.lat.toFixed(2)}°, ${item.lon.toFixed(2)}°
        </div>
      </div>
    `,
      )
      .join("");

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
  }

  function selectSuggestion(item) {
    if (!item || !searchInput) return;

    searchInput.value = item.display;
    suggestionsContainer.style.display = "none";
    suggestionsContainer.innerHTML = "";
    suggestions = [];

    // Search using the coordinates
    searchWeather(`${item.lat},${item.lon}`);
  }

  async function fetchSuggestions(query) {
    if (!query || query.trim().length < 2) {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
      suggestions = [];
      return;
    }

    try {
      const items = await getLocationSuggestions(query);
      suggestions = items;
      renderSuggestions(items);
    } catch (error) {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
      suggestions = [];
    }
  }

  function useGeolocation() {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      return;
    }

    if (!contentEl) return;
    showLoader(contentEl);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await getCurrentByCoords(latitude, longitude);
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
        hideLoader();
        const errorMsg =
          {
            1: "Location access denied. Please enable location services.",
            2: "Unable to retrieve your location. Try searching instead.",
            3: "Location request timed out. Try searching instead.",
          }[error.code] || "Failed to get your location";

        showToast(errorMsg, "error");
        renderError(errorMsg);
      },
    );
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

    if (query.length < 2) {
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
