import { getAllCountries } from "../services/countries.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";
import { openModal, closeModal } from "../components/modal.js";

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
        <div class="actions" style="gap: var(--space-3);">
          <select id="countries-sort" class="input" style="width: auto; min-width: 180px;">
            <option value="name-asc">Name (A-Z)</option>
            <option value="population-desc">Population (High to Low)</option>
            <option value="population-asc">Population (Low to High)</option>
          </select>
          <input
            id="countries-search"
            class="input"
            type="search"
            placeholder="Search countries by name..."
            aria-label="Search countries by name"
            style="width: min(320px, 100%);"
          />
        </div>
      </div>
      <div id="countries-content" class="section-block"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#countries-content");
  const searchInput = appEl.querySelector("#countries-search");
  const sortSelect = appEl.querySelector("#countries-sort");

  let allCountries = [];
  let currentTerm = "";
  let currentSort = "name-asc";
  let debounceTimer = null;

  const filteredCountries = () => {
    if (!currentTerm) return allCountries;
    const term = currentTerm.toLowerCase();
    return allCountries.filter((country) =>
      country.name.common.toLowerCase().includes(term),
    );
  };

  const sortedCountries = (countries) => {
    const sorted = [...countries];
    switch (currentSort) {
      case "name-asc":
        return sorted.sort((a, b) =>
          a.name.common.localeCompare(b.name.common),
        );
      case "population-desc":
        return sorted.sort((a, b) => (b.population || 0) - (a.population || 0));
      case "population-asc":
        return sorted.sort((a, b) => (a.population || 0) - (b.population || 0));
      default:
        return sorted;
    }
  };

  async function loadCountries() {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      allCountries = (await getAllCountries()) || [];
      hideLoader();
      renderCountries(sortedCountries(filteredCountries()));
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
        (country, index) => `
        <div class="card country-card" data-index="${index}" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-lg)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
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
      `,
      )
      .join("");

    contentEl.innerHTML = `
      <div style="display: grid; gap: var(--space-4);">
        ${cardsHtml}
      </div>
    `;

    // Add click handlers for country cards
    const countryCards = contentEl.querySelectorAll(".country-card");
    countryCards.forEach((card) => {
      card.addEventListener("click", () => {
        const index = parseInt(card.dataset.index, 10);
        if (!isNaN(index) && countries[index]) {
          showCountryDetails(countries[index]);
        }
      });
    });
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

  function showCountryDetails(country) {
    const currencies = country.currencies
      ? Object.values(country.currencies)
          .map((c) => `${c.name} (${c.symbol || ""})`)
          .join(", ")
      : "N/A";

    const languages = country.languages
      ? Object.values(country.languages).join(", ")
      : "N/A";

    const contentHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="text-align: center;">
          <img
            src="${country.flags?.svg || country.flags?.png || ""}"
            alt="${country.name.common} flag"
            style="max-width: 200px; max-height: 150px; border-radius: var(--radius); border: 1px solid var(--color-border);"
          />
        </div>
        <div style="display: grid; gap: var(--space-3);">
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Official Name</strong>
            <div style="margin-top: var(--space-1);">${country.name.official || "N/A"}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Capital</strong>
            <div style="margin-top: var(--space-1);">${country.capital?.[0] || "N/A"}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Region</strong>
            <div style="margin-top: var(--space-1);">${country.region || "N/A"}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Subregion</strong>
            <div style="margin-top: var(--space-1);">${country.subregion || "N/A"}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Population</strong>
            <div style="margin-top: var(--space-1);">${formatPopulation(country.population)}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Currencies</strong>
            <div style="margin-top: var(--space-1);">${currencies}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Languages</strong>
            <div style="margin-top: var(--space-1);">${languages}</div>
          </div>
        </div>
      </div>
    `;

    openModal({
      title: country.name.common,
      contentHTML,
    });
  }

  function handleSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentTerm = searchInput?.value?.trim() || "";
      renderCountries(sortedCountries(filteredCountries()));
    }, DEBOUNCE_MS);
  }

  function handleSort() {
    currentSort = sortSelect?.value || "name-asc";
    renderCountries(sortedCountries(filteredCountries()));
  }

  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", handleSort);
  }

  loadCountries();
}
