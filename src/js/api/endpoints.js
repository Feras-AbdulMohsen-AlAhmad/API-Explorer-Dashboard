export const ENDPOINTS = {
  JSONPLACEHOLDER: "https://jsonplaceholder.typicode.com",
  RICK_AND_MORTY: "https://rickandmortyapi.com/api",
  REST_COUNTRIES: "https://restcountries.com/v3.1",
  // OPEN_METEO: "https://api.open-meteo.com/v1",
  WEATHERSTACK: "https://api.weatherstack.com",
};

export function buildUrl(base, path = "") {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}/${normalizedPath}`;
}
