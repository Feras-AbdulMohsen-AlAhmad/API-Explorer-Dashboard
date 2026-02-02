// Countries Service - Handle REST Countries API operations
import * as http from "../api/httpClient.js";
import { ENDPOINTS, buildUrl } from "../api/endpoints.js";

const BASE = ENDPOINTS.REST_COUNTRIES;

export async function getAllCountries() {
  const url = buildUrl(BASE, "/all");
  const response = await http.get(url);
  return response.data;
}

export async function getCountryByName(countryName) {
  const url = buildUrl(BASE, `/name/${countryName}`);
  const response = await http.get(url);
  return response.data;
}

export async function getCountryByCode(countryCode) {
  const url = buildUrl(BASE, `/alpha/${countryCode}`);
  const response = await http.get(url);
  return response.data;
}

export async function getCountriesByRegion(region) {
  const url = buildUrl(BASE, `/region/${region}`);
  const response = await http.get(url);
  return response.data;
}
