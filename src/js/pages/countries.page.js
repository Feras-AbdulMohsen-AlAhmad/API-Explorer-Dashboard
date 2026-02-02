import {
  getAllCountries,
  getCountryByName,
  getCountryByCode,
  getCountriesByRegion,
  sortCountries,
} from "../services/countries.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

const DEBOUNCE_MS = 300;

// Available Regions
const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "africa", label: "Africa" },
  { value: "americas", label: "Americas" },
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "oceania", label: "Oceania" },
];

// Filter modes
const FILTER_MODE = {
  ALL: "all",
  NAME: "name",
  CODE: "code",
  REGION: "region",
};

export function renderCountriesPage(appEl) {
  if (!appEl) return;

  appEl.innerHTML = `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Countries Explorer</h1>
          <p style="color: var(--color-muted);">Explore countries worldwide with REST Countries API - All endpoints included</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-4); border-bottom: 2px solid var(--color-border); padding-bottom: var(--space-2);">
        <button class="filter-tab active" data-mode="${FILTER_MODE.ALL}" style="padding: var(--space-2) var(--space-3); border: none; background: transparent; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;">
          All Countries
        </button>
        <button class="filter-tab" data-mode="${FILTER_MODE.NAME}" style="padding: var(--space-2) var(--space-3); border: none; background: transparent; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;">
          Search by Name
        </button>
        <button class="filter-tab" data-mode="${FILTER_MODE.CODE}" style="padding: var(--space-2) var(--space-3); border: none; background: transparent; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;">
          Search by Code
        </button>
        <button class="filter-tab" data-mode="${FILTER_MODE.REGION}" style="padding: var(--space-2) var(--space-3); border: none; background: transparent; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;">
          Filter by Region
        </button>
      </div>

      <!-- Filter Controls -->
      <div class="page-header" style="margin-bottom: var(--space-4);">
        <!-- Search by Name Panel -->
        <div class="filter-panel" data-panel="${FILTER_MODE.NAME}" style="display: none;">
          <div style="display: flex; gap: var(--space-2); align-items: center;">
            <input
              id="search-name-input"
              class="input"
              type="search"
              placeholder="Search by country name (e.g., Netherlands, Japan)..."
              aria-label="Search by country name"
              style="flex: 1;"
            />
            <button id="search-name-btn" class="btn btn-primary">Search</button>
          </div>
        </div>

        <!-- Search by Code Panel -->
        <div class="filter-panel" data-panel="${FILTER_MODE.CODE}" style="display: none;">
          <div style="display: flex; gap: var(--space-2); align-items: center;">
            <input
              id="search-code-input"
              class="input"
              type="search"
              placeholder="Enter country code (e.g., NL, US, JP)..."
              aria-label="Search by country code"
              maxlength="3"
              style="flex: 1;"
            />
            <button id="search-code-btn" class="btn btn-primary">Search</button>
          </div>
        </div>

        <!-- Filter by Region Panel -->
        <div class="filter-panel" data-panel="${FILTER_MODE.REGION}" style="display: none;">
          <select id="region-select" class="input" style="width: 100%; max-width: 400px;">
            ${REGIONS.map((r) => `<option value="${r.value}">${r.label}</option>`).join("")}
          </select>
        </div>

        <!-- Sort Controls (Always Visible) -->
        <div style="display: flex; gap: var(--space-2); align-items: center; margin-top: var(--space-3);">
          <label for="countries-sort" style="font-weight: 600; color: var(--color-muted);">Sort by:</label>
          <select id="countries-sort" class="input" style="width: auto; min-width: 200px;">
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="population-desc">Population (High to Low)</option>
            <option value="population-asc">Population (Low to High)</option>
            <option value="area-desc">Area (Largest First)</option>
            <option value="area-asc">Area (Smallest First)</option>
          </select>
        </div>
      </div>

      <div id="countries-content" class="section-block"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#countries-content");
  const sortSelect = appEl.querySelector("#countries-sort");
  const filterTabs = appEl.querySelectorAll(".filter-tab");
  const filterPanels = appEl.querySelectorAll(".filter-panel");

  // Name search elements
  const searchNameInput = appEl.querySelector("#search-name-input");
  const searchNameBtn = appEl.querySelector("#search-name-btn");

  // Code search elements
  const searchCodeInput = appEl.querySelector("#search-code-input");
  const searchCodeBtn = appEl.querySelector("#search-code-btn");

  // Region filter elements
  const regionSelect = appEl.querySelector("#region-select");

  let allCountries = [];
  let displayedCountries = [];
  let currentMode = FILTER_MODE.ALL;
  let currentSort = "name-asc";
  let debounceTimer = null;
  let lastAction = null;

  function normalizeCountriesError(error) {
    if (error?.title && error?.message) return error;
    return {
      title: "Countries error",
      message:
        error instanceof Error ? error.message : "Failed to load countries",
    };
  }

  function setLastAction(type, payload = {}) {
    lastAction = { type, ...payload };
  }

  // Handle tab switching
  function switchTab(mode) {
    currentMode = mode;

    // Update active tab styling
    filterTabs.forEach((tab) => {
      const isActive = tab.dataset.mode === mode;
      tab.classList.toggle("active", isActive);
      tab.style.borderBottomColor = isActive
        ? "var(--color-primary)"
        : "transparent";
      tab.style.color = isActive ? "var(--color-primary)" : "";
    });

    // Show/hide filter panels
    filterPanels.forEach((panel) => {
      panel.style.display = panel.dataset.panel === mode ? "block" : "none";
    });

    // Load data based on mode
    if (mode === FILTER_MODE.ALL) {
      loadAllCountries();
    }
  }

  // Attach tab listeners
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.mode));
  });

  const sortedCountries = (countries) => sortCountries(countries, currentSort);

  async function loadAllCountries() {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      setLastAction("all");
      allCountries = (await getAllCountries({ sort: currentSort })) || [];
      displayedCountries = [...allCountries];
      hideLoader();
      renderCountries(sortedCountries(displayedCountries));
      showToast(`Loaded ${allCountries.length} countries`, "success");
    } catch (error) {
      hideLoader();
      const normalized = normalizeCountriesError(error);
      showToast(normalized.message, "error");
      renderError(normalized);
    }
  }

  async function searchByName() {
    const query = searchNameInput?.value?.trim();
    if (!query) {
      showToast("Please enter a country name", "error");
      return;
    }

    showLoader(contentEl);
    try {
      setLastAction("name", { query });
      const countries = await getCountryByName(query, { sort: currentSort });
      displayedCountries = Array.isArray(countries) ? countries : [countries];
      hideLoader();
      renderCountries(sortedCountries(displayedCountries));
      showToast(`Found ${displayedCountries.length} result(s)`, "success");
    } catch (error) {
      hideLoader();
      const normalized = normalizeCountriesError(error);
      showToast(normalized.message, "error");
      renderError(normalized);
    }
  }

  async function searchByCode() {
    const code = searchCodeInput?.value?.trim().toUpperCase();
    if (!code) {
      showToast("Please enter a country code", "error");
      return;
    }

    showLoader(contentEl);
    try {
      setLastAction("code", { code });
      const countries = await getCountryByCode(code, { sort: currentSort });
      displayedCountries = Array.isArray(countries) ? countries : [countries];
      hideLoader();
      renderCountries(sortedCountries(displayedCountries));
      showToast(`Found country with code "${code}"`, "success");
    } catch (error) {
      hideLoader();
      const normalized = normalizeCountriesError(error);
      showToast(normalized.message, "error");
      renderError(normalized);
    }
  }

  async function filterByRegion() {
    const region = regionSelect?.value;
    if (!region || region === "all") {
      setLastAction("all");
      displayedCountries = [...allCountries];
      renderCountries(sortedCountries(displayedCountries));
      return;
    }

    showLoader(contentEl);
    try {
      setLastAction("region", { region });
      const countries = await getCountriesByRegion(region, {
        sort: currentSort,
      });
      displayedCountries = countries || [];
      hideLoader();
      renderCountries(sortedCountries(displayedCountries));
      showToast(
        `Found ${displayedCountries.length} countries in ${region}`,
        "success",
      );
    } catch (error) {
      hideLoader();
      const normalized = normalizeCountriesError(error);
      showToast(normalized.message, "error");
      renderError(normalized);
    }
  }

  function renderCountries(countries) {
    if (!countries.length) {
      contentEl.innerHTML = `
        <div class="state-empty">
          <h3>No countries found</h3>
          <p>Try adjusting your search or filter criteria.</p>
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
                  <strong>Area:</strong> ${country.area ? `${formatPopulation(country.area)} km²` : "N/A"}
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

  function renderError(error) {
    if (!contentEl) return;
    const normalized = normalizeCountriesError(error);
    contentEl.innerHTML = `
      <div class="state-error">
        <h3>${normalized.title || "Failed to load countries"}</h3>
        <p>${normalized.message}</p>
        <button class="btn btn-primary" id="retry-btn">Retry</button>
      </div>
    `;

    const retryBtn = contentEl.querySelector("#retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        if (!lastAction) {
          loadAllCountries();
          return;
        }

        switch (lastAction.type) {
          case "name":
            searchNameInput.value = lastAction.query || "";
            searchByName();
            break;
          case "code":
            searchCodeInput.value = lastAction.code || "";
            searchByCode();
            break;
          case "region":
            regionSelect.value = lastAction.region || "all";
            filterByRegion();
            break;
          default:
            loadAllCountries();
            break;
        }
      });
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
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Area</strong>
            <div style="margin-top: var(--space-1);">${country.area ? `${formatPopulation(country.area)} km²` : "N/A"}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Timezones</strong>
            <div style="margin-top: var(--space-1);">${country.timezones?.join(", ") || "N/A"}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Country Codes</strong>
            <div style="margin-top: var(--space-1);">${country.cca2} / ${country.cca3}</div>
          </div>
          <div>
            <strong style="color: var(--color-muted); font-size: var(--font-size-sm);">Borders</strong>
            <div style="margin-top: var(--space-1);">${country.borders?.join(", ") || "None"}</div>
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

  function handleSort() {
    currentSort = sortSelect?.value || "name-asc";
    renderCountries(sortedCountries(displayedCountries));
  }

  // Attach event listeners
  if (searchNameBtn) {
    searchNameBtn.addEventListener("click", searchByName);
  }
  if (searchNameInput) {
    searchNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchByName();
    });
  }

  if (searchCodeBtn) {
    searchCodeBtn.addEventListener("click", searchByCode);
  }
  if (searchCodeInput) {
    searchCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchByCode();
    });
  }

  if (regionSelect) {
    regionSelect.addEventListener("change", filterByRegion);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", handleSort);
  }

  // Initial load
  loadAllCountries();
}
