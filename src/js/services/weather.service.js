// Weather Service - Handle Weatherstack weather data fetching
import * as http from "../api/httpClient.js";
import { ENDPOINTS, buildUrl } from "../api/endpoints.js";
import { WEATHERSTACK_ACCESS_KEY } from "../config.js";

const BASE = ENDPOINTS.WEATHERSTACK;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const weatherCache = new Map(); // In-memory cache: key -> { data, timestamp }

/**
 * Generate cache key from query and units
 * @param {string} query - Weather query
 * @param {string} units - Temperature units ("m" for metric, "s" for scientific, "f" for Fahrenheit)
 * @returns {string} Cache key
 */
function getCacheKey(query, units = "m") {
  return `${query}|${units}`;
}

/**
 * Check if cache entry is still valid
 * @param {number} timestamp - Cache entry timestamp
 * @returns {boolean} True if cache is still valid (within 10 minutes)
 */
function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_DURATION_MS;
}

/**
 * Get cached data if available and valid
 * @param {string} cacheKey - Cache key from getCacheKey()
 * @returns {Object|null} Cached data or null if invalid/missing
 */
function getCachedData(cacheKey) {
  const cached = weatherCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  // Remove invalid cache entry
  if (cached) {
    weatherCache.delete(cacheKey);
  }
  return null;
}

/**
 * Store data in cache
 * @param {string} cacheKey - Cache key from getCacheKey()
 * @param {Object} data - Data to cache
 */
function setCachedData(cacheKey, data) {
  weatherCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Get current weather by query (city name, country, coordinates)
 * Results are cached for 10 minutes to reduce API calls on FREE tier (100/month limit)
 * @param {string} query - City, country, or coordinates (e.g., "New York", "lat,lon", "fetch:ip")
 * @param {Object} options - Optional parameters
 * @param {string} options.units - "m" (metric), "s" (scientific), or "f" (Fahrenheit)
 * @param {string} options.language - Language code (default: "en")
 * @param {boolean} options.skipCache - Skip cache and force fresh API call (default: false)
 * @returns {Promise<Object>} Current weather data
 */
export async function getCurrentByQuery(query, options = {}) {
  const { units = "m", language = "en", skipCache = false } = options;

  if (!query || query.trim() === "") {
    throw new Error("Query cannot be empty");
  }

  // Check cache first (unless explicitly skipped)
  if (!skipCache) {
    const cacheKey = getCacheKey(query.trim(), units);
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  const params = new URLSearchParams();
  params.set("access_key", WEATHERSTACK_ACCESS_KEY);
  params.set("query", query.trim());
  params.set("units", units);
  params.set("language", language);

  const baseUrl = buildUrl(BASE, "/current");
  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await http.get(url);

    if (response.data?.error) {
      const errorMsg =
        response.data.error.info || "Failed to fetch weather data";
      throw new Error(errorMsg);
    }

    if (!response.data?.current) {
      throw new Error("No weather data available for this location");
    }

    // Cache the successful response
    const cacheKey = getCacheKey(query.trim(), units);
    setCachedData(cacheKey, response.data);

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Weather service error";
    throw new Error(message);
  }
}

/**
 * Get current weather by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} options - Optional parameters (units, language, skipCache)
 * @returns {Promise<Object>} Current weather data
 */
export async function getCurrentByCoords(lat, lon, options = {}) {
  if (!lat || !lon) {
    throw new Error("Latitude and longitude are required");
  }

  // Format as "lat,lon" for Weatherstack
  const query = `${lat},${lon}`;
  return getCurrentByQuery(query, options);
}

/**
 * Get current weather using IP address (fallback for geolocation)
 * Uses Weatherstack's special "fetch:ip" query to detect user's location
 * @param {Object} options - Optional parameters (units, language, skipCache)
 * @returns {Promise<Object>} Current weather data based on IP location
 */
export async function getCurrentByAutoIP(options = {}) {
  return getCurrentByQuery("fetch:ip", options);
}

/**
 * Get location suggestions for autocomplete
 * @param {string} query - Search query (minimum 2 characters)
 * @returns {Promise<Array>} Array of location suggestions with name, region, country, coordinates, and display text
 */
export async function getLocationSuggestions(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams();
  params.set("access_key", WEATHERSTACK_ACCESS_KEY);
  params.set("query", query.trim());

  const baseUrl = buildUrl(BASE, "/current");
  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await http.get(url);

    // If there's an error or no location data, return empty array
    if (response.data?.error || !response.data?.location) {
      return [];
    }

    const { location } = response.data;

    // Format single location result as suggestion object
    return [
      {
        name: location.name,
        region: location.region,
        country: location.country,
        lat: location.lat,
        lon: location.lon,
        display: `${location.name}${location.region ? ", " + location.region : ""}, ${location.country}`,
      },
    ];
  } catch (error) {
    // Silently fail and return empty array for autocomplete
    return [];
  }
}
