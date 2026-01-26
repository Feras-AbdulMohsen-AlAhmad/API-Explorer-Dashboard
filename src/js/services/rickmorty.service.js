import * as http from "../api/httpClient.js";
import { ENDPOINTS, buildUrl } from "../api/endpoints.js";

const BASE = ENDPOINTS.RICK_AND_MORTY;

export async function getCharacters({
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
