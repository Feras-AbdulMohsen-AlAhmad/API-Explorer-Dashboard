// Weather Service - Weatherstack FREE tier with localStorage caching
import * as http from "../api/httpClient.js";
import { ENDPOINTS } from "../api/endpoints.js";
import { getConfig } from "../config.js";

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
    throw new Error("Query is required and must be a non-empty string");
  }

  const trimmedQuery = query.trim();

  // Check cache first (unless explicitly skipped)
  if (!skipCache) {
    const cacheKey = buildCacheKey(trimmedQuery, units);
    const cachedData = readCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  // Make API request
  const url = buildWeatherstackUrl(trimmedQuery, units, language);

  try {
    const response = await http.get(url);

    // Handle Weatherstack error format: { success: false, error: { code, type, info } }
    if (response.data?.success === false || response.data?.error) {
      const error = response.data.error || {};
      const code = error.code || "UNKNOWN";
      const info = error.info || "Failed to fetch weather data";
      throw new Error(`[Weatherstack ${code}] ${info}`);
    }

    // Validate response has weather data
    if (!response.data?.current) {
      throw new Error("No weather data available for this location");
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
    // Re-throw with clean message
    const message =
      error instanceof Error ? error.message : "Weather service error";
    throw new Error(message);
  }
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
    throw new Error("Latitude and longitude must be numbers");
  }

  if (lat < -90 || lat > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (lon < -180 || lon > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }

  // Format as "lat,lon" for Weatherstack
  const query = `${lat},${lon}`;
  return getCurrentByQuery(query, options);
}

/**
 * Get current weather using IP address (fallback for geolocation)
 * Uses Weatherstack's "fetch:ip" query to detect user's location automatically
 * @param {Object} options - Optional parameters (units, language, skipCache)
 * @returns {Promise<Object>} Normalized weather data: { location, current, raw }
 * @throws {Error} If API request fails
 */
export async function getCurrentByAutoIP(options = {}) {
  return getCurrentByQuery("fetch:ip", options);
}
