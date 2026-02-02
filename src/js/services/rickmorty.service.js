import * as rickmortyApi from "../api/rickmorty.api.js";
import { mapRickMortyError } from "../utils/error-mapper.js";
import { deduplicateRequest } from "../utils/request-deduplicator.js";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const charactersCache = new Map();
const characterCache = new Map();

function buildCharactersCacheKey(options = {}) {
  const page = options.page ?? 1;
  const name = (options.name || "").trim().toLowerCase();
  const status = (options.status || "").trim().toLowerCase();
  const species = (options.species || "").trim().toLowerCase();
  const gender = (options.gender || "").trim().toLowerCase();
  return `characters:${page}:${name}:${status}:${species}:${gender}`;
}

function getCache(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    map.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(map, key, data) {
  map.set(key, { timestamp: Date.now(), data });
}

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
    const cacheKey = buildCharactersCacheKey(options);
    const cached = getCache(charactersCache, cacheKey);
    if (cached) return cached;

    return await deduplicateRequest(cacheKey, async () => {
      const data = await rickmortyApi.fetchCharacters(options);
      const normalized = {
        info: data?.info || null,
        results: normalizeCharacters(data?.results || []),
      };
      setCache(charactersCache, cacheKey, normalized);
      return normalized;
    });
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
    const cacheKey = `character:${id}`;
    const cached = getCache(characterCache, cacheKey);
    if (cached) return cached;

    return await deduplicateRequest(cacheKey, async () => {
      const data = await rickmortyApi.fetchCharacterById(id);
      const normalized = normalizeCharacter(data);
      setCache(characterCache, cacheKey, normalized);
      return normalized;
    });
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
    const idsKey = Array.isArray(ids) ? ids.join(",") : String(ids || "");
    const cacheKey = `characters:ids:${idsKey}`;
    const cached = getCache(charactersCache, cacheKey);
    if (cached) return cached;

    return await deduplicateRequest(cacheKey, async () => {
      const data = await rickmortyApi.fetchCharactersByIds(ids);
      const normalized = normalizeCharacters(
        Array.isArray(data) ? data : [data],
      );
      setCache(charactersCache, cacheKey, normalized);
      return normalized;
    });
  } catch (error) {
    throw mapRickMortyError(error);
  }
}
