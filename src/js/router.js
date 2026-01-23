import { renderPostsPage } from "./pages/posts.page.js";
import { renderCharactersPage } from "./pages/characters.page.js";
import { renderCountriesPage } from "./pages/countries.page.js";
import { renderWeatherPage } from "./pages/weather.page.js";

const routes = {
  "#posts": renderPostsPage,
  "#characters": renderCharactersPage,
  "#countries": renderCountriesPage,
  "#weather": renderWeatherPage,
};

function normalizeHash(hash) {
  if (!hash || !routes[hash]) {
    return "#posts";
  }
  return hash;
}

function renderRoute(hash, appRoot) {
  const safeHash = normalizeHash(hash);
  if (safeHash !== hash) {
    window.location.hash = safeHash;
    return;
  }
  const handler = routes[safeHash];
  if (typeof handler === "function") {
    handler(appRoot);
  }
}

export function initRouter(appRoot) {
  if (!appRoot) return;
  window.addEventListener("hashchange", () =>
    renderRoute(window.location.hash, appRoot),
  );
  renderRoute(window.location.hash, appRoot);
}
