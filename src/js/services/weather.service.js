// Weather Service - WeatherAPI.com with localStorage caching
import { mapWeatherError } from "../utils/error-mapper.js";
import { startLoading, stopLoading } from "../state/loading.state.js";
import {
  deduplicateRequest,
  isRequestInFlight,
} from "../utils/request-deduplicator.js";
import {
  incrementNetworkRequest,
  incrementCacheHit,
  incrementDeduplicated,
} from "../state/weather.debug.js";
import {
  fetchCurrentWeather,
  fetchLocationSearch,
  fetchForecast,
  fetchHistory,
} from "../api/weather.api.js";

// Constants
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_PREFIX = "weatherapi:current:";

// ============================================================================
// HELPERS - Internal utility functions
// ============================================================================

/**
 * Normalize units for WeatherAPI.com (supports metric/imperial only)
 * @param {string} units - Requested units (m | f | s)
 * @returns {string} "m" or "f"
 */
function normalizeUnits(units) {
  return units === "f" ? "f" : "m";
}

/**
 * Normalize query for consistent cache keys
 * - City/country names → lowercase for case-insensitive caching
 * - Coordinates (lat,lon) → preserve as-is
 * - IP queries (auto:ip) → preserve as-is
 * @param {string} query - Raw query string
 * @returns {string} Normalized query
 */
function normalizeQuery(query) {
  const trimmed = query.trim();

  // For coordinates (contains comma) or IP queries, keep as-is
  if (trimmed.includes(",") || trimmed === "auto:ip") {
    return trimmed;
  }

  // For city/country names, lowercase for consistency
  return trimmed.toLowerCase();
}

/**
 * Build cache key for localStorage
 * Format: "weatherapi:current:<units>:<normalizedQuery>"
 * @param {string} query - Search query
 * @param {string} units - Temperature units (m/s/f)
 * @returns {string} Cache key
 */
function buildCacheKey(query, units) {
  const normalized = normalizeQuery(query);
  return `${CACHE_PREFIX}${units}:${normalized}`;
}

/**
 * Build a request deduplication key for weather fetch
 * @param {string} type - Request type (query | coords | ip)
 * @param {string} value - Query or coordinates
 * @param {string} units - Temperature units
 * @returns {string} Deduplication key
 */
function buildDedupKey(type, value, units) {
  return `weather:${type}:${value}:${units}`;
}

/**
 * Check if cached timestamp is still valid (within TTL)
 * @param {number} timestamp - Cache entry timestamp in milliseconds
 * @returns {boolean} True if cache is still valid
 */
function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL_MS;
}

/**
 * Read from localStorage cache
 * @param {string} cacheKey - Cache key from buildCacheKey()
 * @returns {Object|null} Cached data or null if invalid/missing
 */
function readCache(cacheKey) {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { ts, data } = JSON.parse(cached);

    // Validate TTL
    if (!isCacheValid(ts)) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Failed to read cache:", error.message);
    return null;
  }
}

/**
 * Write to localStorage cache
 * @param {string} cacheKey - Cache key from buildCacheKey()
 * @param {Object} data - Data to cache
 */
function writeCache(cacheKey, data) {
  try {
    const cacheEntry = {
      ts: Date.now(),
      data: data,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn("Failed to write cache:", error.message);
  }
}

/**
 * Normalize WeatherAPI.com response to the UI's expected shape
 * @param {Object} rawResponse - Raw WeatherAPI.com response
 * @param {string} units - "m" or "f" to select appropriate fields
 * @returns {Object} Normalized weather data with location, current, and raw fields
 */
function normalizeWeatherData(rawResponse, units) {
  const { location = {}, current = {} } = rawResponse;
  const isFahrenheit = units === "f";
  const condition = current.condition || {};
  const iconUrl = condition.icon
    ? condition.icon.startsWith("//")
      ? `https:${condition.icon}`
      : condition.icon
    : "";

  return {
    location: {
      name: location.name || "Unknown",
      country: location.country || "",
      region: location.region || "",
      localtime: location.localtime || "",
      timezone_id: location.tz_id || "",
      lat: location.lat || 0,
      lon: location.lon || 0,
    },
    current: {
      temperature: isFahrenheit
        ? (current.temp_f ?? null)
        : (current.temp_c ?? null),
      weather_descriptions: condition.text ? [condition.text] : [],
      weather_icons: iconUrl ? [iconUrl] : [],
      wind_speed: isFahrenheit
        ? (current.wind_mph ?? null)
        : (current.wind_kph ?? null),
      wind_dir: current.wind_dir || "",
      humidity: current.humidity ?? null,
      pressure: current.pressure_mb ?? null,
      feelslike: isFahrenheit
        ? (current.feelslike_f ?? null)
        : (current.feelslike_c ?? null),
      visibility: isFahrenheit
        ? (current.vis_miles ?? null)
        : (current.vis_km ?? null),
      uv_index: current.uv ?? null,
      precip: current.precip_mm ?? null,
    },
    raw: rawResponse,
  };
}

// ============================================================================
// PUBLIC API - Exported functions
// ============================================================================

/**
 * Get current weather by query (city, country, coordinates, or auto:ip)
 * Results cached in localStorage for 10 minutes
 *
 * @param {string} query - City name, country, coordinates ("lat,lon"), or "auto:ip"
 * @param {Object} options - Optional parameters
 * @param {string} options.units - "m" (metric), "f" (Fahrenheit) - default: "m"
 * @param {string} options.language - Language code (e.g., "en", "es", "fr") - default: "en"
 * @param {boolean} options.skipCache - Force fresh API call, bypass cache - default: false
 * @returns {Promise<Object>} Normalized weather data: { location, current, raw }
 * @throws {Error} If query is empty, WeatherAPI returns error, or network fails
 */
export async function getCurrentByQuery(query, options = {}) {
  const { units = "m", language = "en", skipCache = false } = options;
  const resolvedUnits = normalizeUnits(units);

  // Validate query
  if (!query || typeof query !== "string" || query.trim() === "") {
    throw mapWeatherError({ type: "validation", message: "query_required" });
  }

  const trimmedQuery = query.trim();
  const dedupKey = buildDedupKey("query", trimmedQuery, resolvedUnits);

  if (isRequestInFlight(dedupKey)) {
    incrementDeduplicated();
  }

  return deduplicateRequest(dedupKey, async () => {
    // Check cache first (unless explicitly skipped)
    if (!skipCache) {
      const cacheKey = buildCacheKey(trimmedQuery, resolvedUnits);
      const cachedData = readCache(cacheKey);
      if (cachedData) {
        incrementCacheHit();
        return cachedData;
      }
    }

    startLoading("weather");
    try {
      // Make API request (WeatherAPI.com current.json)
      incrementNetworkRequest();
      const response = await fetchCurrentWeather(trimmedQuery, {
        language,
      });

      // Handle WeatherAPI error format: { error: { code, message } }
      if (response?.error) {
        throw mapWeatherError({ source: "weatherapi", ...response.error });
      }

      // Validate response has weather data
      if (!response?.current) {
        throw mapWeatherError({ source: "weatherapi", message: "no_data" });
      }

      // Normalize response structure
      const normalizedData = normalizeWeatherData(response, resolvedUnits);

      // Cache the successful response
      if (!skipCache) {
        const cacheKey = buildCacheKey(trimmedQuery, resolvedUnits);
        writeCache(cacheKey, normalizedData);
      }

      return normalizedData;
    } catch (error) {
      throw mapWeatherError(error);
    } finally {
      stopLoading("weather");
    }
  });
}

/**
 * Get current weather by coordinates
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lon - Longitude (-180 to 180)
 * @param {Object} options - Optional parameters (units, language, skipCache)
 * @returns {Promise<Object>} Normalized weather data: { location, current, raw }
 * @throws {Error} If coordinates are invalid or API request fails
 */
export async function getCurrentByCoords(lat, lon, options = {}) {
  // Validate coordinates
  if (typeof lat !== "number" || typeof lon !== "number") {
    throw mapWeatherError({ type: "validation", message: "invalid_coords" });
  }

  if (lat < -90 || lat > 90) {
    throw mapWeatherError({ type: "validation", message: "invalid_coords" });
  }

  if (lon < -180 || lon > 180) {
    throw mapWeatherError({ type: "validation", message: "invalid_coords" });
  }

  // Format as "lat,lon" for WeatherAPI.com
  const query = `${lat},${lon}`;
  const resolvedUnits = normalizeUnits(options?.units || "m");
  const dedupKey = buildDedupKey("coords", query, resolvedUnits);
  if (isRequestInFlight(dedupKey)) {
    incrementDeduplicated();
  }
  return deduplicateRequest(dedupKey, () => getCurrentByQuery(query, options));
}

/**
 * Get current weather using IP address (fallback for geolocation)
 * Uses WeatherAPI.com's "auto:ip" query to detect user's location automatically
 * @param {Object} options - Optional parameters (units, language, skipCache)
 * @returns {Promise<Object>} Normalized weather data: { location, current, raw }
 * @throws {Error} If API request fails
 */
export async function getCurrentByAutoIP(options = {}) {
  const resolvedUnits = normalizeUnits(options?.units || "m");
  const dedupKey = buildDedupKey("ip", "auto:ip", resolvedUnits);
  if (isRequestInFlight(dedupKey)) {
    incrementDeduplicated();
  }
  return deduplicateRequest(dedupKey, () =>
    getCurrentByQuery("auto:ip", options),
  );
}

/**
 * Get historical weather data for a specific date
 * NOTE: WeatherAPI.com historical data requires a paid plan
 *
 * @param {string} query - City name, country, or coordinates ("lat,lon")
 * @param {string} date - Historical date in YYYY-MM-DD format (e.g., "2024-01-15")
 * @param {Object} options - Optional parameters
 * @param {string} options.units - "m" (metric), "f" (Fahrenheit) - default: "m"
 * @param {string} options.language - Language code (e.g., "en", "es", "fr") - default: "en"
 * @returns {Promise<Object>} Historical weather data: { location, historical, raw }
 * @throws {Error} If query/date is invalid, API returns error, or plan doesn't support historical data
 */
export async function getHistoricalWeather(query, date, options = {}) {
  const { units = "m", language = "en" } = options;
  const resolvedUnits = normalizeUnits(units);

  // Validate query
  if (!query || typeof query !== "string" || query.trim() === "") {
    throw mapWeatherError({ type: "validation", message: "query_required" });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date || !dateRegex.test(date)) {
    throw mapWeatherError({
      type: "validation",
      message: "Invalid date format. Use YYYY-MM-DD (e.g., 2024-01-15)",
    });
  }

  startLoading("weather");
  try {
    incrementNetworkRequest();
    const response = await fetchHistory(query.trim(), date, { language });

    // Handle WeatherAPI error format
    if (response?.error) {
      throw mapWeatherError({ source: "weatherapi", ...response.error });
    }

    // Validate response has historical data
    if (!response?.forecast?.forecastday) {
      throw mapWeatherError({
        source: "weatherapi",
        message: "Historical data not available. Upgrade your plan.",
      });
    }

    return {
      location: normalizeWeatherData(response, resolvedUnits).location,
      historical: response.forecast.forecastday,
      raw: response,
    };
  } catch (error) {
    throw mapWeatherError(error);
  } finally {
    stopLoading("weather");
  }
}

/**
 * Get weather forecast for upcoming days
 * NOTE: WeatherAPI.com forecast data may require a paid plan for higher limits
 *
 * @param {string} query - City name, country, or coordinates ("lat,lon")
 * @param {Object} options - Optional parameters
 * @param {number} options.forecast_days - Number of forecast days (1-14) - default: 7
 * @param {string} options.units - "m" (metric), "f" (Fahrenheit) - default: "m"
 * @param {string} options.language - Language code (e.g., "en", "es", "fr") - default: "en"
 * @returns {Promise<Object>} Forecast data: { location, current, forecast, raw }
 * @throws {Error} If query is invalid, API returns error, or plan doesn't support forecast
 */
export async function getForecastWeather(query, options = {}) {
  const { forecast_days = 7, units = "m", language = "en" } = options;
  const resolvedUnits = normalizeUnits(units);

  // Validate query
  if (!query || typeof query !== "string" || query.trim() === "") {
    throw mapWeatherError({ type: "validation", message: "query_required" });
  }

  // Validate forecast days
  if (forecast_days < 1 || forecast_days > 14) {
    throw mapWeatherError({
      type: "validation",
      message: "forecast_days must be between 1 and 14",
    });
  }

  startLoading("weather");
  try {
    incrementNetworkRequest();
    const response = await fetchForecast(query.trim(), {
      days: forecast_days,
      language,
    });

    // Handle WeatherAPI error format
    if (response?.error) {
      throw mapWeatherError({ source: "weatherapi", ...response.error });
    }

    // Validate response has forecast data
    if (!response?.forecast?.forecastday) {
      throw mapWeatherError({
        source: "weatherapi",
        message: "Forecast data not available. Upgrade your plan.",
      });
    }

    return {
      location: normalizeWeatherData(response, resolvedUnits).location,
      current: response.current
        ? normalizeWeatherData(response, resolvedUnits).current
        : null,
      forecast: response.forecast,
      raw: response,
    };
  } catch (error) {
    throw mapWeatherError(error);
  } finally {
    stopLoading("weather");
  }
}

/**
 * Autocomplete location search (returns matching locations)
 * WeatherAPI.com endpoint: /search.json
 *
 * @param {string} query - Partial location name (e.g., "New Y", "Lond")
 * @returns {Promise<Array>} Array of matching locations with name, country, region, lat, lon
 * @throws {Error} If query is too short or API returns error
 */
export async function autocompleteLocation(query) {
  // Validate query (minimum 2 characters)
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    throw mapWeatherError({
      type: "validation",
      message: "Query must be at least 2 characters long",
    });
  }

  startLoading("weather");
  try {
    incrementNetworkRequest();
    const response = await fetchLocationSearch(query.trim());

    // Handle WeatherAPI error format
    if (response?.error) {
      throw mapWeatherError({ source: "weatherapi", ...response.error });
    }

    // Return array of location results
    if (!response || !Array.isArray(response)) {
      throw mapWeatherError({
        source: "weatherapi",
        message: "Autocomplete not available or returned no results.",
      });
    }

    return response.map((location) => ({
      name: location.name || "",
      country: location.country || "",
      region: location.region || "",
      lat: location.lat || 0,
      lon: location.lon || 0,
      timezone_id: location.tz_id || "",
    }));
  } catch (error) {
    throw mapWeatherError(error);
  } finally {
    stopLoading("weather");
  }
}
