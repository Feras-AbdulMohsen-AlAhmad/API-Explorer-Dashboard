import * as rickmortyApi from "../api/rickmorty.api.js";
import { mapRickMortyError } from "../utils/error-mapper.js";

/**
 * Normalize a single character response
 * @param {object} character - Raw character object from API
 * @returns {object} Normalized character object
 */
function normalizeCharacter(character) {
  if (!character || typeof character !== "object") return character;
  return {
    id: character.id ?? null,
    name: character.name ?? "",
    status: character.status ?? "unknown",
    species: character.species ?? "",
    gender: character.gender ?? "",
    image: character.image ?? "",
    origin: character.origin ?? { name: "Unknown" },
    location: character.location ?? { name: "Unknown" },
    ...character,
  };
}

/**
 * Normalize array or single character response
 * @param {object|array} data - Character(s) from API
 * @returns {array|object} Normalized character(s)
 */
function normalizeCharacters(data) {
  if (Array.isArray(data)) return data.map(normalizeCharacter);
  return normalizeCharacter(data);
}

/**
 * Fetch characters with pagination and filters
 * @param {object} options - Pagination and filter options
 * @returns {object} Pagination info + normalized results array
 */
export async function getCharacters(options = {}) {
  try {
    const data = await rickmortyApi.fetchCharacters(options);
    return {
      info: data?.info || null,
      results: normalizeCharacters(data?.results || []),
    };
  } catch (error) {
    throw mapRickMortyError(error);
  }
}

/**
 * Fetch single character by ID
 * @param {number} id - Character ID
 * @returns {object} Normalized character object
 */
export async function getCharacterById(id) {
  try {
    const data = await rickmortyApi.fetchCharacterById(id);
    return normalizeCharacter(data);
  } catch (error) {
    throw mapRickMortyError(error);
  }
}

/**
 * Fetch multiple characters by IDs
 * @param {array} ids - Array of character IDs
 * @returns {array} Normalized characters array
 */
export async function getCharactersByIds(ids) {
  try {
    const data = await rickmortyApi.fetchCharactersByIds(ids);
    return normalizeCharacters(Array.isArray(data) ? data : [data]);
  } catch (error) {
    throw mapRickMortyError(error);
  }
}
