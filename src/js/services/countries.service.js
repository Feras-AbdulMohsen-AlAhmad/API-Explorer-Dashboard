// Countries Service - Handle REST Countries API operations
import * as http from "../api/httpClient.js";
import { ENDPOINTS, buildUrl } from "../api/endpoints.js";

const BASE = ENDPOINTS.REST_COUNTRIES;

export async function getAllCountries() {
  const url = buildUrl(BASE, "/all");
  const response = await http.get(url);
  return response.data;
}
