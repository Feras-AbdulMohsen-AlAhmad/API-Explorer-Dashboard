// Countries Service - REST Countries API integration
import * as countriesApi from "../api/countries.api.js";
import { mapCountriesError } from "../utils/error-mapper.js";

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
    const data = await countriesApi.fetchAllCountries();
    const normalized = normalizeCountries(data) || [];
    return sortCountries(normalized, options.sort);
  } catch (error) {
    throw mapCountriesError(error);
  }
}

export async function getCountryByName(countryName, options = {}) {
  try {
    const data = await countriesApi.fetchCountryByName(countryName);
    const normalized = normalizeCountries(data) || [];
    return sortCountries(normalized, options.sort);
  } catch (error) {
    throw mapCountriesError(error);
  }
}

export async function getCountryByCode(countryCode, options = {}) {
  try {
    const data = await countriesApi.fetchCountryByCode(countryCode);
    const normalized = normalizeCountries(data) || [];
    return sortCountries(normalized, options.sort);
  } catch (error) {
    throw mapCountriesError(error);
  }
}

export async function getCountriesByRegion(region, options = {}) {
  try {
    const data = await countriesApi.fetchCountriesByRegion(region);
    const normalized = normalizeCountries(data) || [];
    return sortCountries(normalized, options.sort);
  } catch (error) {
    throw mapCountriesError(error);
  }
}
