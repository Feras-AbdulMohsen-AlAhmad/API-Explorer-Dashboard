// WeatherAPI.com API layer
// Maps WeatherAPI endpoints to the app's service layer

import * as http from "./httpClient.js";
import { ENDPOINTS } from "./endpoints.js";
import { getConfig } from "../config.js";

const BASE_URL = ENDPOINTS.WEATHER_API;

/**
 * Get WeatherAPI.com key from loaded config
 * @returns {string} API key
 */
function getApiKey() {
  const config = getConfig();
  return config.WEATHER_API_KEY;
}

/**
 * Build a WeatherAPI.com URL with standard key + params
 * @param {string} path - Endpoint path (e.g., /current.json)
 * @param {Object} params - Query params
 * @returns {string} Fully qualified URL
 */
function buildWeatherApiUrl(path, params = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("key", getApiKey());

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  return `${BASE_URL}${path}?${searchParams.toString()}`;
}

/**
 * Fetch current weather by query
 * WeatherAPI endpoint: /current.json?q=<city|country|lat,lon|auto:ip>
 */
export async function fetchCurrentWeather(query, options = {}) {
  const url = buildWeatherApiUrl("/current.json", {
    q: query,
    lang: options.language,
    aqi: options.aqi || "no",
  });
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch location suggestions
 * WeatherAPI endpoint: /search.json?q=<partial>
 */
export async function fetchLocationSearch(query) {
  const url = buildWeatherApiUrl("/search.json", { q: query });
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch forecast data
 * WeatherAPI endpoint: /forecast.json?q=<query>&days=<1-14>
 */
export async function fetchForecast(query, options = {}) {
  const url = buildWeatherApiUrl("/forecast.json", {
    q: query,
    days: options.days ?? 7,
    lang: options.language,
    aqi: options.aqi || "no",
    alerts: options.alerts || "no",
  });
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch historical weather data
 * WeatherAPI endpoint: /history.json?q=<query>&dt=<YYYY-MM-DD>
 */
export async function fetchHistory(query, date, options = {}) {
  const url = buildWeatherApiUrl("/history.json", {
    q: query,
    dt: date,
    lang: options.language,
  });
  const response = await http.get(url);
  return response.data;
}
