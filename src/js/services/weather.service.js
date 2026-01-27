// Weather Service - Handle Weatherstack weather data fetching
import * as http from "../api/httpClient.js";
import { ENDPOINTS, buildUrl } from "../api/endpoints.js";
import { WEATHERSTACK_ACCESS_KEY } from "../config.js";

const BASE = ENDPOINTS.WEATHERSTACK;

/**
 * Get current weather by query (city name, country, coordinates)
 * @param {string} query - City, country, or coordinates (e.g., "New York", "lat,lon")
 * @param {Object} options - Optional parameters
 * @param {string} options.units - "m" (metric) or "s" (scientific)
 * @param {string} options.language - Language code (default: "en")
 * @returns {Promise<Object>} Current weather data
 */
export async function getCurrentByQuery(query, options = {}) {
  const { units = "m", language = "en" } = options;

  if (!query || query.trim() === "") {
    throw new Error("Query cannot be empty");
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
 * @param {Object} options - Optional parameters (units, language)
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
