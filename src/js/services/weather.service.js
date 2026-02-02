// Weather Service - Weatherstack FREE tier with localStorage caching
import * as http from "../api/httpClient.js";
import { ENDPOINTS } from "../api/endpoints.js";
import { getConfig } from "../config.js";
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

// Constants
const BASE_URL = ENDPOINTS.WEATHERSTACK;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_PREFIX = "weatherstack:current:";

// ============================================================================
// HELPERS - Internal utility functions
// ============================================================================

/**
 * Get Weatherstack API key from loaded config
 * @returns {string} API access key
 */
function getApiKey() {
  const config = getConfig();
  return config.WEATHERSTACK_ACCESS_KEY;
}

/**
 * Normalize query for consistent cache keys
 * - City/country names → lowercase for case-insensitive caching
 * - Coordinates (lat,lon) → preserve as-is
 * - IP queries (fetch:ip) → preserve as-is
 * @param {string} query - Raw query string
 * @returns {string} Normalized query
 */
function normalizeQuery(query) {
  const trimmed = query.trim();

  // For coordinates (contains comma) or IP queries, keep as-is
  if (trimmed.includes(",") || trimmed === "fetch:ip") {
    return trimmed;
  }

  // For city/country names, lowercase for consistency
  return trimmed.toLowerCase();
}

/**
 * Build cache key for localStorage
 * Format: "weatherstack:current:<units>:<normalizedQuery>"
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
 * Build Weatherstack API URL with parameters
 * @param {string} query - Weather query
 * @param {string} units - Temperature units
 * @param {string} language - Language code
 * @returns {string} Complete API URL
 */
function buildWeatherstackUrl(query, units, language) {
  const params = new URLSearchParams();
  params.set("access_key", getApiKey());
  params.set("query", query);
  params.set("units", units);
  params.set("language", language);

  return `${BASE_URL}/current?${params.toString()}`;
}

/**
 * Normalize Weatherstack API response to consistent structure
 * @param {Object} rawResponse - Raw Weatherstack API response
 * @returns {Object} Normalized weather data with location, current, and raw fields
 */
function normalizeWeatherData(rawResponse) {
  const { location = {}, current = {} } = rawResponse;

  return {
    location: {
      name: location.name || "Unknown",
      country: location.country || "",
      region: location.region || "",
      localtime: location.localtime || "",
      timezone_id: location.timezone_id || "",
      lat: location.lat || 0,
      lon: location.lon || 0,
    },
    current: {
      temperature: current.temperature ?? null,
      weather_descriptions: current.weather_descriptions || [],
      weather_icons: current.weather_icons || [],
      wind_speed: current.wind_speed ?? null,
      wind_dir: current.wind_dir || "",
      humidity: current.humidity ?? null,
      pressure: current.pressure ?? null,
      feelslike: current.feelslike ?? null,
      visibility: current.visibility ?? null,
      uv_index: current.uv_index ?? null,
      precip: current.precip ?? null,
    },
    raw: rawResponse,
  };
}

// ============================================================================
// PUBLIC API - Exported functions
// ============================================================================

/**
 * Get current weather by query (city, country, coordinates)
 * Results cached in localStorage for 10 minutes to optimize FREE tier (100 calls/month)
 *
 * @param {string} query - City name, country, coordinates ("lat,lon"), or "fetch:ip"
 * @param {Object} options - Optional parameters
 * @param {string} options.units - "m" (metric), "s" (scientific), "f" (Fahrenheit) - default: "m"
 * @param {string} options.language - Language code (e.g., "en", "es", "fr") - default: "en"
 * @param {boolean} options.skipCache - Force fresh API call, bypass cache - default: false
 * @returns {Promise<Object>} Normalized weather data: { location, current, raw }
 * @throws {Error} If query is empty, Weatherstack returns error, or network fails
 */
export async function getCurrentByQuery(query, options = {}) {
  const { units = "m", language = "en", skipCache = false } = options;

  // Validate query
  if (!query || typeof query !== "string" || query.trim() === "") {
    throw mapWeatherError({ type: "validation", message: "query_required" });
  }

  const trimmedQuery = query.trim();
  const dedupKey = buildDedupKey("query", trimmedQuery, units);

  if (isRequestInFlight(dedupKey)) {
    incrementDeduplicated();
  }

  return deduplicateRequest(dedupKey, async () => {
    // Check cache first (unless explicitly skipped)
    if (!skipCache) {
      const cacheKey = buildCacheKey(trimmedQuery, units);
      const cachedData = readCache(cacheKey);
      if (cachedData) {
        incrementCacheHit();
        return cachedData;
      }
    }

    startLoading("weather");
    try {
      // Make API request
      const url = buildWeatherstackUrl(trimmedQuery, units, language);
      incrementNetworkRequest();
      const response = await http.get(url);

      // Handle Weatherstack error format: { success: false, error: { code, type, info } }
      if (response.data?.success === false || response.data?.error) {
        const error = response.data.error || {};
        throw mapWeatherError({ source: "weatherstack", ...error });
      }

      // Validate response has weather data
      if (!response.data?.current) {
        throw mapWeatherError({ source: "weatherstack", message: "no_data" });
      }

      // Normalize response structure
      const normalizedData = normalizeWeatherData(response.data);

      // Cache the successful response
      if (!skipCache) {
        const cacheKey = buildCacheKey(trimmedQuery, units);
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

  // Format as "lat,lon" for Weatherstack
  const query = `${lat},${lon}`;
  const dedupKey = buildDedupKey("coords", query, options?.units || "m");
  if (isRequestInFlight(dedupKey)) {
    incrementDeduplicated();
  }
  return deduplicateRequest(dedupKey, () => getCurrentByQuery(query, options));
}

/**
 * Get current weather using IP address (fallback for geolocation)
 * Uses Weatherstack's "fetch:ip" query to detect user's location automatically
 * @param {Object} options - Optional parameters (units, language, skipCache)
 * @returns {Promise<Object>} Normalized weather data: { location, current, raw }
 * @throws {Error} If API request fails
 */
export async function getCurrentByAutoIP(options = {}) {
  const dedupKey = buildDedupKey("ip", "fetch:ip", options?.units || "m");
  if (isRequestInFlight(dedupKey)) {
    incrementDeduplicated();
  }
  return deduplicateRequest(dedupKey, () =>
    getCurrentByQuery("fetch:ip", options),
  );
}

/**
 * Get historical weather data for a specific date
 * NOTE: Requires paid Weatherstack plan (Standard or higher)
 *
 * @param {string} query - City name, country, or coordinates ("lat,lon")
 * @param {string} date - Historical date in YYYY-MM-DD format (e.g., "2024-01-15")
 * @param {Object} options - Optional parameters
 * @param {string} options.units - "m" (metric), "s" (scientific), "f" (Fahrenheit) - default: "m"
 * @param {string} options.language - Language code (e.g., "en", "es", "fr") - default: "en"
 * @param {string} options.hourly - "1" to include hourly data - default: "0"
 * @param {string} options.interval - Hourly interval (1, 3, 6, 12, 24) - default: "1"
 * @returns {Promise<Object>} Historical weather data: { location, historical, raw }
 * @throws {Error} If query/date is invalid, API returns error, or plan doesn't support historical data
 */
export async function getHistoricalWeather(query, date, options = {}) {
  const {
    units = "m",
    language = "en",
    hourly = "0",
    interval = "1",
  } = options;

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
    const params = new URLSearchParams();
    params.set("access_key", getApiKey());
    params.set("query", query.trim());
    params.set("historical_date", date);
    params.set("units", units);
    params.set("language", language);
    params.set("hourly", hourly);
    params.set("interval", interval);

    const url = `${BASE_URL}/historical?${params.toString()}`;
    incrementNetworkRequest();
    const response = await http.get(url);

    // Handle Weatherstack error format
    if (response.data?.success === false || response.data?.error) {
      const error = response.data.error || {};
      throw mapWeatherError({ source: "weatherstack", ...error });
    }

    // Validate response has historical data
    if (!response.data?.historical) {
      throw mapWeatherError({
        source: "weatherstack",
        message:
          "Historical data not available. Upgrade to Standard plan or higher.",
      });
    }

    return {
      location: normalizeWeatherData(response.data).location,
      historical: response.data.historical,
      raw: response.data,
    };
  } catch (error) {
    throw mapWeatherError(error);
  } finally {
    stopLoading("weather");
  }
}

/**
 * Get weather forecast for upcoming days
 * NOTE: Requires paid Weatherstack plan (Professional or higher)
 *
 * @param {string} query - City name, country, or coordinates ("lat,lon")
 * @param {Object} options - Optional parameters
 * @param {number} options.forecast_days - Number of forecast days (1-14) - default: 7
 * @param {string} options.units - "m" (metric), "s" (scientific), "f" (Fahrenheit) - default: "m"
 * @param {string} options.language - Language code (e.g., "en", "es", "fr") - default: "en"
 * @param {string} options.hourly - "1" to include hourly data - default: "0"
 * @param {string} options.interval - Hourly interval (1, 3, 6, 12, 24) - default: "3"
 * @returns {Promise<Object>} Forecast data: { location, current, forecast, raw }
 * @throws {Error} If query is invalid, API returns error, or plan doesn't support forecast
 */
export async function getForecastWeather(query, options = {}) {
  const {
    forecast_days = 7,
    units = "m",
    language = "en",
    hourly = "0",
    interval = "3",
  } = options;

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
    const params = new URLSearchParams();
    params.set("access_key", getApiKey());
    params.set("query", query.trim());
    params.set("forecast_days", forecast_days.toString());
    params.set("units", units);
    params.set("language", language);
    params.set("hourly", hourly);
    params.set("interval", interval);

    const url = `${BASE_URL}/forecast?${params.toString()}`;
    incrementNetworkRequest();
    const response = await http.get(url);

    // Handle Weatherstack error format
    if (response.data?.success === false || response.data?.error) {
      const error = response.data.error || {};
      throw mapWeatherError({ source: "weatherstack", ...error });
    }

    // Validate response has forecast data
    if (!response.data?.forecast) {
      throw mapWeatherError({
        source: "weatherstack",
        message:
          "Forecast data not available. Upgrade to Professional plan or higher.",
      });
    }

    return {
      location: normalizeWeatherData(response.data).location,
      current: response.data.current
        ? normalizeWeatherData(response.data).current
        : null,
      forecast: response.data.forecast,
      raw: response.data,
    };
  } catch (error) {
    throw mapWeatherError(error);
  } finally {
    stopLoading("weather");
  }
}

/**
 * Autocomplete location search (returns matching locations)
 * NOTE: Requires paid Weatherstack plan (Professional or higher)
 * Useful for implementing search suggestions with real location data
 *
 * @param {string} query - Partial location name (e.g., "New Y", "Lond")
 * @returns {Promise<Array>} Array of matching locations with name, country, region, lat, lon
 * @throws {Error} If query is too short, API returns error, or plan doesn't support autocomplete
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
    const params = new URLSearchParams();
    params.set("access_key", getApiKey());
    params.set("query", query.trim());

    const url = `${BASE_URL}/autocomplete?${params.toString()}`;
    incrementNetworkRequest();
    const response = await http.get(url);

    // Handle Weatherstack error format
    if (response.data?.success === false || response.data?.error) {
      const error = response.data.error || {};
      throw mapWeatherError({ source: "weatherstack", ...error });
    }

    // Return array of location results
    if (!response.data?.results || !Array.isArray(response.data.results)) {
      throw mapWeatherError({
        source: "weatherstack",
        message:
          "Autocomplete not available. Upgrade to Professional plan or higher.",
      });
    }

    return response.data.results.map((location) => ({
      name: location.name || "",
      country: location.country || "",
      region: location.region || "",
      lat: location.lat || 0,
      lon: location.lon || 0,
      timezone_id: location.timezone_id || "",
    }));
  } catch (error) {
    throw mapWeatherError(error);
  } finally {
    stopLoading("weather");
  }
}
