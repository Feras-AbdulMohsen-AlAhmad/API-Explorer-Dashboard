import { getForecast } from "../services/weather.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";

// Amsterdam coordinates
const DEFAULT_LOCATION = {
  name: "Amsterdam",
  lat: 52.3676,
  lon: 4.9041,
};

export function renderWeatherPage(appEl) {
  if (!appEl) return;

  appEl.innerHTML = `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Weather</h1>
          <p style="color: var(--color-muted);">Current weather and forecast from Open-Meteo API.</p>
        </div>
      </div>
      <div id="weather-content" class="section-block"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#weather-content");

  async function loadWeather() {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      const data = await getForecast({
        lat: DEFAULT_LOCATION.lat,
        lon: DEFAULT_LOCATION.lon,
      });
      hideLoader();
      renderWeather(data);
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load weather data";
      showToast(message, "error");
      renderError(message);
    }
  }

  function renderWeather(data) {
    if (!data || !data.current) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <h3>No weather data available</h3>
          <p>Unable to retrieve weather information.</p>
        </div>
      `;
      return;
    }

    const currentTemp = data.current.temperature_2m;
    const currentUnit = data.current_units?.temperature_2m || "°C";
    const dailyForecasts = data.daily || {};
    const dailyTimes = dailyForecasts.time || [];
    const dailyMaxTemps = dailyForecasts.temperature_2m_max || [];
    const dailyMinTemps = dailyForecasts.temperature_2m_min || [];

    const forecastHtml = dailyTimes
      .slice(0, 7)
      .map((date, index) => {
        const maxTemp = dailyMaxTemps[index];
        const minTemp = dailyMinTemps[index];
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        return `
          <div class="card" style="padding: var(--space-4);">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-4);">
              <div style="font-weight: 500;">${dayName}</div>
              <div style="display: flex; gap: var(--space-3); align-items: center; color: var(--color-muted); font-size: var(--font-size-sm);">
                <span style="color: var(--color-error);">↑ ${maxTemp}${currentUnit}</span>
                <span style="color: var(--color-primary);">↓ ${minTemp}${currentUnit}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    contentEl.innerHTML = `
      <div style="display: grid; gap: var(--space-5);">
        <div class="card" style="padding: var(--space-6); text-align: center;">
          <div style="color: var(--color-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
            ${DEFAULT_LOCATION.name}
          </div>
          <div style="font-size: 4rem; font-weight: 700; margin: var(--space-4) 0;">
            ${currentTemp}${currentUnit}
          </div>
          <div style="color: var(--color-muted);">Current Temperature</div>
        </div>
        
        <div>
          <h2 style="margin: 0 0 var(--space-4); font-size: var(--font-size-xl);">7-Day Forecast</h2>
          <div style="display: grid; gap: var(--space-3);">
            ${forecastHtml}
          </div>
        </div>
      </div>
    `;
  }

  function renderError(message) {
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="error-state">
        <h3>Failed to Load Weather Data</h3>
        <p>${message}</p>
        <button class="btn btn-primary" id="retry-btn">Retry</button>
      </div>
    `;

    const retryBtn = contentEl.querySelector("#retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", loadWeather);
    }
  }

  loadWeather();
}
