import { getAllCountries } from "../services/countries.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";

const DEBOUNCE_MS = 300;

export function renderCountriesPage(appEl) {
  if (!appEl) return;

  appEl.innerHTML = `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Countries</h1>
          <p style="color: var(--color-muted);">Explore countries worldwide with REST Countries API.</p>
        </div>
        <div class="actions" style="width: min(320px, 100%);">
          <input
            id="countries-search"
            class="input"
            type="search"
            placeholder="Search countries by name..."
            aria-label="Search countries by name"
          />
        </div>
      </div>
      <div id="countries-content" class="section-block"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#countries-content");
  const searchInput = appEl.querySelector("#countries-search");

  let allCountries = [];
  let currentTerm = "";
  let debounceTimer = null;

  const filteredCountries = () => {
    if (!currentTerm) return allCountries;
    const term = currentTerm.toLowerCase();
    return allCountries.filter((country) =>
      country.name.common.toLowerCase().includes(term)
    );
  };

  async function loadCountries() {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      allCountries = (await getAllCountries()) || [];
      hideLoader();
      renderCountries(filteredCountries());
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load countries";
      showToast(message, "error");
      renderError(message);
    }
  }

  function renderCountries(countries) {
    if (!countries.length) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <h3>${currentTerm ? "No matches found" : "No countries available"}</h3>
          <p>${currentTerm ? "Try a different search." : "Try again later."}</p>
        </div>
      `;
      return;
    }

    const cardsHtml = countries
      .map(
        (country) => `
        <div class="card">
          <div style="display: flex; gap: var(--space-4); align-items: flex-start;">
            <img
              src="${country.flags?.png || ""}"
              alt="${country.name.common} flag"
              style="width: 80px; height: 60px; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--color-border);"
              loading="lazy"
            />
            <div style="flex: 1; min-width: 0;">
              <h3 style="margin: 0 0 var(--space-2); font-size: var(--font-size-lg);">
                ${country.name.common}
              </h3>
              <div style="display: grid; gap: var(--space-2); color: var(--color-muted); font-size: var(--font-size-sm);">
                <div>
                  <strong>Region:</strong> ${country.region || "N/A"}
                  ${country.subregion ? ` (${country.subregion})` : ""}
                </div>
                <div>
                  <strong>Population:</strong> ${formatPopulation(country.population)}
                </div>
                <div>
                  <strong>Capital:</strong> ${country.capital?.[0] || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    contentEl.innerHTML = `
      <div style="display: grid; gap: var(--space-4);">
        ${cardsHtml}
      </div>
    `;
  }

  function renderError(message) {
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="error-state">
        <h3>Failed to Load Countries</h3>
        <p>${message}</p>
        <button class="btn btn-primary" id="retry-btn">Retry</button>
      </div>
    `;

    const retryBtn = contentEl.querySelector("#retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", loadCountries);
    }
  }

  function formatPopulation(pop) {
    if (!pop && pop !== 0) return "N/A";
    return new Intl.NumberFormat().format(pop);
  }

  function handleSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentTerm = searchInput?.value?.trim() || "";
      renderCountries(filteredCountries());
    }, DEBOUNCE_MS);
  }

  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  loadCountries();
}
