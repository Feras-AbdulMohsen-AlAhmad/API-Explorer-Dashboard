import {
  getAllCountries,
  getCountryByName,
  getCountryByCode,
  getCountriesByRegion,
} from "../services/countries.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";
import { openModal, closeModal } from "../components/modal.js";

const DEBOUNCE_MS = 300;
const REGIONS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

export function renderCountriesPage(appEl) {
  if (!appEl) return;

  appEl.innerHTML = `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Countries</h1>
          <p style="color: var(--color-muted);">Explore countries worldwide with REST Countries API.</p>
        </div>
        <div class="actions" style="gap: var(--space-3); display: flex; flex-wrap: wrap; align-items: center;">
          <select id="countries-sort" class="input" style="width: auto; min-width: 180px;">
            <option value="name-asc">Name (A-Z)</option>
            <option value="population-desc">Population (High to Low)</option>
            <option value="population-asc">Population (Low to High)</option>
          </select>
          
          <select id="countries-filter-type" class="input" style="width: auto; min-width: 150px;">
            <option value="all">All Countries</option>
            <option value="name">Search by Name</option>
            <option value="code">Search by Code</option>
            <option value="region">Filter by Region</option>
          </select>

          <div id="countries-filter-inputs" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <input
              id="countries-search"
              class="input"
              type="search"
              placeholder="Search by name..."
              aria-label="Search countries by name"
              style="width: min(280px, 100%);"
            />
          </div>
        </div>
      </div>
      <div id="countries-applied-filter" style="padding: var(--space-3); color: var(--color-muted); font-size: var(--font-size-sm); display: none;">
        <strong id="filter-label"></strong>
        <button id="clear-filter-btn" class="btn btn-sm" style="margin-left: var(--space-2); padding: var(--space-1) var(--space-2);">Clear Filter</button>
      </div>
      <div id="countries-content" class="section-block"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#countries-content");
  const searchInput = appEl.querySelector("#countries-search");
  const sortSelect = appEl.querySelector("#countries-sort");
  const filterTypeSelect = appEl.querySelector("#countries-filter-type");
  const filterInputsDiv = appEl.querySelector("#countries-filter-inputs");
  const appliedFilterDiv = appEl.querySelector("#countries-applied-filter");
  const filterLabelEl = appEl.querySelector("#filter-label");
  const clearFilterBtn = appEl.querySelector("#clear-filter-btn");

  let allCountries = [];
  let currentFilterType = "all";
  let currentFilterValue = "";
  let currentSort = "name-asc";
  let debounceTimer = null;
  let displayCountries = [];

  // Update filter inputs based on filter type
  function updateFilterInputs() {
    filterInputsDiv.innerHTML = "";
    searchInput.style.display = "none";

    if (currentFilterType === "name") {
      const input = document.createElement("input");
      input.type = "search";
      input.id = "countries-search";
      input.className = "input";
      input.placeholder = "Enter country name...";
      input.setAttribute("aria-label", "Search countries by name");
      input.style.width = "min(280px, 100%)";
      filterInputsDiv.appendChild(input);
      input.addEventListener("input", handleFilterInput);
      input.focus();
    } else if (currentFilterType === "code") {
      const input = document.createElement("input");
      input.type = "text";
      input.id = "countries-code-search";
      input.className = "input";
      input.placeholder = "Enter country code (2-3 letters)...";
      input.setAttribute("aria-label", "Search countries by ISO code");
      input.style.width = "min(280px, 100%)";
      input.maxLength = "3";
      filterInputsDiv.appendChild(input);
      input.addEventListener("input", handleFilterInput);
      input.focus();
    } else if (currentFilterType === "region") {
      const select = document.createElement("select");
      select.id = "countries-region-select";
      select.className = "input";
      select.style.width = "auto";
      select.style.minWidth = "150px";
      select.innerHTML =
        `<option value="">Select a region...</option>` +
        REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("");
      filterInputsDiv.appendChild(select);
      select.addEventListener("change", handleFilterInput);
      select.focus();
    }
  }

  // Filter type changed
  function handleFilterTypeChange() {
    currentFilterType = filterTypeSelect?.value || "all";
    currentFilterValue = "";
    displayCountries = [];
    updateFilterInputs();

    if (currentFilterType === "all") {
      appliedFilterDiv.style.display = "none";
      renderCountries(sortedCountries(allCountries));
    }
  }

  // Handle filter input changes
  function handleFilterInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (currentFilterType === "name") {
        const input = filterInputsDiv.querySelector("#countries-search");
        currentFilterValue = input?.value?.trim() || "";
        if (currentFilterValue.length > 0) {
          await loadCountriesByName(currentFilterValue);
        }
      } else if (currentFilterType === "code") {
        const input = filterInputsDiv.querySelector("#countries-code-search");
        currentFilterValue = input?.value?.trim().toUpperCase() || "";
        if (currentFilterValue.length >= 2) {
          await loadCountriesByCode(currentFilterValue);
        }
      } else if (currentFilterType === "region") {
        const select = filterInputsDiv.querySelector(
          "#countries-region-select",
        );
        currentFilterValue = select?.value || "";
        if (currentFilterValue) {
          await loadCountriesByRegion(currentFilterValue);
        }
      }
    }, DEBOUNCE_MS);
  }

  // Load all countries (no filter)
  async function loadCountries() {
    if (!contentEl) return;
    showLoader(contentEl);
    appliedFilterDiv.style.display = "none";
    try {
      allCountries = (await getAllCountries()) || [];
      displayCountries = [...allCountries];
      hideLoader();
      renderCountries(sortedCountries(displayCountries));
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load countries";
      showToast(message, "error");
      renderError(message, loadCountries);
    }
  }

  // Load countries by name
  async function loadCountriesByName(name) {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      const results = (await getCountryByName(name)) || [];
      displayCountries = results;
      hideLoader();
      appliedFilterDiv.style.display = "block";
      filterLabelEl.textContent = `Showing results for: "${name}" (${results.length} found)`;
      renderCountries(sortedCountries(displayCountries));
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Country not found";
      showToast(message, "error");
      displayCountries = [];
      appliedFilterDiv.style.display = "block";
      filterLabelEl.textContent = `No results found for: "${name}"`;
      renderCountries([]);
    }
  }

  // Load countries by code
  async function loadCountriesByCode(code) {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      const results = (await getCountryByCode(code)) || [];
      displayCountries = results;
      hideLoader();
      appliedFilterDiv.style.display = "block";
      filterLabelEl.textContent = `Country code: ${code.toUpperCase()} (${results.length} found)`;
      renderCountries(sortedCountries(displayCountries));
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Country code not found";
      showToast(message, "error");
      displayCountries = [];
      appliedFilterDiv.style.display = "block";
      filterLabelEl.textContent = `No country found with code: "${code.toUpperCase()}"`;
      renderCountries([]);
    }
  }

  // Load countries by region
  async function loadCountriesByRegion(region) {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      const results = (await getCountriesByRegion(region)) || [];
      displayCountries = results;
      hideLoader();
      appliedFilterDiv.style.display = "block";
      filterLabelEl.textContent = `Region: ${region} (${results.length} countries)`;
      renderCountries(sortedCountries(displayCountries));
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load region";
      showToast(message, "error");
      displayCountries = [];
      appliedFilterDiv.style.display = "block";
      filterLabelEl.textContent = `Failed to load region: ${region}`;
      renderCountries([]);
    }
  }

  // Render countries grid
  function renderCountries(countries) {
    if (!countries.length) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <h3>${currentFilterType !== "all" ? "No matches found" : "No countries available"}</h3>
          <p>${currentFilterType !== "all" ? "Try a different search or filter." : "Try again later."}</p>
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

  // Render error state
  function renderError(message, retryFn) {
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="error-state">
        <h3>Failed to Load Countries</h3>
        <p>${message}</p>
        <button class="btn btn-primary" id="retry-btn">Retry</button>
      </div>
    `;

    const retryBtn = contentEl.querySelector("#retry-btn");
    if (retryBtn && retryFn) {
      retryBtn.addEventListener("click", retryFn);
    }
  }

  // Sort countries
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

  // Format population with commas
  function formatPopulation(pop) {
    if (!pop && pop !== 0) return "N/A";
    return new Intl.NumberFormat().format(pop);
  }

  // Show country details in modal
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
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Country Code</strong>
            <div style="margin-top: var(--space-1);">${country.cca2 || "N/A"} (Alpha-2) / ${country.cca3 || "N/A"} (Alpha-3)</div>
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
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Area</strong>
            <div style="margin-top: var(--space-1);">${formatPopulation(country.area)} km²</div>
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

  // Event listeners
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value || "name-asc";
      renderCountries(sortedCountries(displayCountries));
    });
  }

  if (filterTypeSelect) {
    filterTypeSelect.addEventListener("change", handleFilterTypeChange);
  }

  if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", () => {
      currentFilterType = "all";
      currentFilterValue = "";
      filterTypeSelect.value = "all";
      appliedFilterDiv.style.display = "none";
      loadCountries();
      updateFilterInputs();
    });
  }

  // Initialize
  updateFilterInputs();
  loadCountries();
}
