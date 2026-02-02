// Persistence helper for last successful weather state

const STORAGE_KEY = "weather_last_state";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const VALID_TYPES = new Set(["query", "coords", "ip"]);
const VALID_UNITS = new Set(["m", "f"]);

/**
 * Save the last successful weather state
 * @param {Object} state - Weather state object
 */
export function saveLastWeatherState(state) {
  if (!state || typeof state !== "object") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Fail silently if storage is unavailable
  }
}

/**
 * Get the last successful weather state
 * @returns {Object|null} State object or null if missing/invalid/expired
 */
export function getLastWeatherState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      clearLastWeatherState();
      return null;
    }

    const { type, units, timestamp } = parsed;
    if (!VALID_TYPES.has(type) || !VALID_UNITS.has(units)) {
      clearLastWeatherState();
      return null;
    }

    if (typeof timestamp !== "number") {
      clearLastWeatherState();
      return null;
    }

    // Expiration check (24 hours)
    if (Date.now() - timestamp > MAX_AGE_MS) {
      clearLastWeatherState();
      return null;
    }

    if (type === "query") {
      if (!parsed.query || typeof parsed.query !== "string") {
        clearLastWeatherState();
        return null;
      }
    }

    if (type === "coords") {
      const coords = parsed.coords;
      if (
        !coords ||
        typeof coords.lat !== "number" ||
        typeof coords.lon !== "number"
      ) {
        clearLastWeatherState();
        return null;
      }
    }

    return parsed;
  } catch (e) {
    clearLastWeatherState();
    return null;
  }
}

/**
 * Clear the last weather state from storage
 */
export function clearLastWeatherState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Fail silently
  }
}
