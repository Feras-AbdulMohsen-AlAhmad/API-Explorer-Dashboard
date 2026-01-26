// Weather Service - Handle Open-Meteo weather data fetching
import * as http from "../api/httpClient.js";
import { ENDPOINTS, buildUrl } from "../api/endpoints.js";

const BASE = ENDPOINTS.OPEN_METEO;

export async function getForecast({ lat, lon }) {
  const params = new URLSearchParams();
  params.set("latitude", String(lat));
  params.set("longitude", String(lon));
  params.set("current", "temperature_2m,weather_code");
  params.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  params.set("timezone", "auto");

  const baseUrl = buildUrl(BASE, "/forecast");
  const url = `${baseUrl}?${params.toString()}`;
  const response = await http.get(url);
  return response.data;
}
