// Rick & Morty API layer
// Pure HTTP operations for Rick & Morty endpoints

import * as http from "./httpClient.js";
import { ENDPOINTS, buildUrl } from "./endpoints.js";

const BASE = ENDPOINTS.RICK_AND_MORTY;

/**
 * Fetch characters with optional filters and pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default 1)
 * @param {string} options.name - Filter by character name
 * @param {string} options.status - Filter by status (alive, dead, unknown)
 * @param {string} options.species - Filter by species
 * @param {string} options.gender - Filter by gender (male, female, genderless, unknown)
 * @returns {Promise<Object>} API response with info and results
 */
export async function fetchCharacters({
  page = 1,
  name,
  status,
  species,
  gender,
} = {}) {
  const params = new URLSearchParams();

  if (page) params.set("page", String(page));
  if (name) params.set("name", name.trim());
  if (status) params.set("status", status.trim());
  if (species) params.set("species", species.trim());
  if (gender) params.set("gender", gender.trim());

  const baseUrl = buildUrl(BASE, "/character");
  const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch a single character by ID
 * @param {number} id - Character ID
 * @returns {Promise<Object>} Character object
 */
export async function fetchCharacterById(id) {
  const url = buildUrl(BASE, `/character/${id}`);
  const response = await http.get(url);
  return response.data;
}

/**
 * Fetch multiple characters by IDs
 * @param {Array<number>} ids - Array of character IDs
 * @returns {Promise<Array>} Array of character objects
 */
export async function fetchCharactersByIds(ids) {
  const url = buildUrl(BASE, `/character/${ids.join(",")}`);
  const response = await http.get(url);
  return response.data;
}
