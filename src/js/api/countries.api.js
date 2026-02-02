// REST Countries API layer
// Pure HTTP operations for Countries endpoints

import * as http from "./httpClient.js";
import { ENDPOINTS, buildUrl } from "./endpoints.js";

const BASE = ENDPOINTS.REST_COUNTRIES;

/**
 * Fetch all countries
 * @returns {Promise<Array>} Array of country objects
 */
export async function fetchAllCountries() {
  const url = buildUrl(BASE, "/all");
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch country by name
 * @param {string} countryName - Country name (exact or partial)
 * @returns {Promise<Array>} Array of matching country objects
 */
export async function fetchCountryByName(countryName) {
  const url = buildUrl(BASE, `/name/${countryName}`);
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch country by ISO alpha code
 * @param {string} countryCode - 2 or 3 letter country code
 * @returns {Promise<Array>} Array of matching country objects
 */
export async function fetchCountryByCode(countryCode) {
  const url = buildUrl(BASE, `/alpha/${countryCode}`);
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch countries by region
 * @param {string} region - Region name (Africa, Americas, Asia, Europe, Oceania)
 * @returns {Promise<Array>} Array of countries in region
 */
export async function fetchCountriesByRegion(region) {
  const url = buildUrl(BASE, `/region/${region}`);
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch countries by capital city
 * @param {string} capital - Capital city name
 * @returns {Promise<Array>} Array of matching countries
 */
export async function fetchCountriesByCapital(capital) {
  const url = buildUrl(BASE, `/capital/${capital}`);
  const response = await http.get(url);
  return response.data;
}
