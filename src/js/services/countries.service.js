// Countries Service - REST Countries API integration
import * as countriesApi from "../api/countries.api.js";
import { mapCountriesError } from "../utils/error-mapper.js";
import { deduplicateRequest } from "../utils/request-deduplicator.js";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_PREFIX = "countries:";

function buildCacheKey(type, value) {
  const normalized = String(value ?? "all")
    .trim()
    .toLowerCase();
  return `${CACHE_PREFIX}${type}:${normalized}`;
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const timestamp = parsed.timestamp || 0;
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data || null;
  } catch (error) {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (error) {
    // Ignore cache write failures (storage unavailable or quota exceeded)
  }
}

async function fetchWithCache(cacheKey, fetchFn) {
  const cached = readCache(cacheKey);
  if (cached) return cached;

  return deduplicateRequest(cacheKey, async () => {
    const data = await fetchFn();
    const normalized = normalizeCountries(data) || [];
    writeCache(cacheKey, normalized);
    return normalized;
  });
}

function normalizeCountry(country) {
  if (!country || typeof country !== "object") return country;
  return {
    name: {
      common: country.name?.common || "",
      official: country.name?.official || "",
    },
    cca2: country.cca2 || "",
    cca3: country.cca3 || "",
    region: country.region || "",
    subregion: country.subregion || "",
    capital: Array.isArray(country.capital) ? country.capital : [],
    population: country.population ?? 0,
    area: country.area ?? 0,
    flags: {
      png: country.flags?.png || "",
      svg: country.flags?.svg || "",
    },
    borders: Array.isArray(country.borders) ? country.borders : [],
    timezones: Array.isArray(country.timezones) ? country.timezones : [],
    currencies: country.currencies || {},
    languages: country.languages || {},
    ...country,
  };
}

function normalizeCountries(data) {
  if (Array.isArray(data)) return data.map(normalizeCountry);
  return normalizeCountry(data);
}

export function sortCountries(countries, sortKey = "name-asc") {
  if (!Array.isArray(countries)) return countries;
  const sorted = [...countries];
  switch (sortKey) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.common.localeCompare(b.name.common));
    case "name-desc":
      return sorted.sort((a, b) => b.name.common.localeCompare(a.name.common));
    case "population-desc":
      return sorted.sort((a, b) => (b.population || 0) - (a.population || 0));
    case "population-asc":
      return sorted.sort((a, b) => (a.population || 0) - (b.population || 0));
    case "area-desc":
      return sorted.sort((a, b) => (b.area || 0) - (a.area || 0));
    case "area-asc":
      return sorted.sort((a, b) => (a.area || 0) - (b.area || 0));
    default:
      return sorted;
  }
}

export async function getAllCountries(options = {}) {
  try {
    const cacheKey = buildCacheKey("all", "all");
    const normalized = await fetchWithCache(cacheKey, () =>
      countriesApi.fetchAllCountries(),
    );
    return sortCountries(normalized, options.sort);
  } catch (error) {
    throw mapCountriesError(error);
  }
}

export async function getCountryByName(countryName, options = {}) {
  try {
    const cacheKey = buildCacheKey("name", countryName);
    const normalized = await fetchWithCache(cacheKey, () =>
      countriesApi.fetchCountryByName(countryName),
    );
    return sortCountries(normalized, options.sort);
  } catch (error) {
    throw mapCountriesError(error);
  }
}

export async function getCountryByCode(countryCode, options = {}) {
  try {
    const cacheKey = buildCacheKey("code", countryCode);
    const normalized = await fetchWithCache(cacheKey, () =>
      countriesApi.fetchCountryByCode(countryCode),
    );
    return sortCountries(normalized, options.sort);
  } catch (error) {
    throw mapCountriesError(error);
  }
}

export async function getCountriesByRegion(region, options = {}) {
  try {
    const cacheKey = buildCacheKey("region", region);
    const normalized = await fetchWithCache(cacheKey, () =>
      countriesApi.fetchCountriesByRegion(region),
    );
    return sortCountries(normalized, options.sort);
  } catch (error) {
    throw mapCountriesError(error);
  }
}
