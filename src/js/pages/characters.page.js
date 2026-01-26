import { getCharacters } from "../services/rickmorty.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

export function renderCharactersPage(appEl) {
  if (!appEl) return;

  appEl.innerHTML = `
		<section class="page">
			<div class="page-header">
				<div>
					<h1>Characters</h1>
					<p style="color: var(--color-muted);">Rick and Morty multiverse characters.</p>
				</div>
        <div class="actions" style="flex-wrap: wrap; gap: var(--space-3);">
          <input
            id="char-search"
            class="input"
            type="search"
            placeholder="Search by name..."
            aria-label="Search characters by name"
            style="width: min(220px, 100%);"
          />
          <input
            id="char-species"
            class="input"
            type="text"
            placeholder="Species"
            aria-label="Filter by species"
            style="width: min(180px, 100%);"
          />
          <select id="char-status" class="input" aria-label="Filter by status" style="width: min(150px, 100%);">
            <option value="">Any status</option>
            <option value="alive">Alive</option>
            <option value="dead">Dead</option>
            <option value="unknown">Unknown</option>
          </select>
          <select id="char-gender" class="input" aria-label="Filter by gender" style="width: min(150px, 100%);">
            <option value="">Any gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="genderless">Genderless</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
				<div class="actions" id="char-pagination" style="gap: var(--space-3);">
					<button class="btn btn-secondary" id="prev-page">Prev</button>
					<button class="btn btn-secondary" id="next-page">Next</button>
				</div>
			</div>
			<div id="characters-content" class="section-block"></div>
		</section>
	`;

  const contentEl = appEl.querySelector("#characters-content");
  const searchInput = appEl.querySelector("#char-search");
  const speciesInput = appEl.querySelector("#char-species");
  const statusSelect = appEl.querySelector("#char-status");
  const genderSelect = appEl.querySelector("#char-gender");
  const prevBtn = appEl.querySelector("#prev-page");
  const nextBtn = appEl.querySelector("#next-page");

  let state = {
    page: 1,
    info: null,
    results: [],
    filters: {
      name: "",
      status: "",
      species: "",
      gender: "",
    },
  };

  async function loadPage(page = 1) {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      const data = await getCharacters({ page, ...state.filters });
      state = {
        page,
        info: data?.info || null,
        results: data?.results || [],
        filters: state.filters,
      };
      hideLoader();
      renderCharacters(state.results);
      renderPagination();
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load characters";
      showToast(message, "error");
      renderError(message);
    }
  }

  function updateFilters(nextFilters, resetPage = true) {
    state.filters = { ...state.filters, ...nextFilters };
    const nextPage = resetPage ? 1 : state.page;
    loadPage(nextPage);
  }

  function renderCharacters(list) {
    if (!list || list.length === 0) {
      contentEl.innerHTML = `
				<div class="empty-state">
					<h3>No characters found</h3>
					<p>Try adjusting filters or pagination.</p>
				</div>
			`;
      return;
    }

    contentEl.innerHTML = `
			<div class="cards-grid">
				${list
          .map(
            (character) => `
              <article
                class="card"
                data-character-id="${character.id}"
                tabindex="0"
                aria-label="${escapeHtml(character.name)}"
              >
								<div style="display: flex; gap: var(--space-4); align-items: center;">
									<img src="${character.image}" alt="${escapeHtml(character.name)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-md);" loading="lazy" />
									<div>
										<h3>${escapeHtml(character.name)}</h3>
										<p style="color: var(--color-muted);">Status: ${escapeHtml(character.status)}</p>
									</div>
								</div>
							</article>
						`,
          )
          .join("")}
			</div>
		`;

    attachCardHandlers();
  }

  function renderPagination() {
    const hasPrev = Boolean(state.info?.prev);
    const hasNext = Boolean(state.info?.next);
    if (prevBtn) prevBtn.disabled = !hasPrev;
    if (nextBtn) nextBtn.disabled = !hasNext;
    if (prevBtn) prevBtn.textContent = hasPrev ? "Prev" : "Prev";
    if (nextBtn) nextBtn.textContent = hasNext ? "Next" : "Next";
  }

  function attachCardHandlers() {
    const cards = contentEl.querySelectorAll("[data-character-id]");
    cards.forEach((card) => {
      const id = card.getAttribute("data-character-id");
      if (!id) return;
      card.addEventListener("click", () => openCharacterModal(Number(id)));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCharacterModal(Number(id));
        }
      });
    });
  }

  function renderError(message) {
    contentEl.innerHTML = `
			<div class="error-state">
				<h3>Unable to load characters</h3>
				<p>${escapeHtml(message)}</p>
				<div class="actions" style="justify-content: center; margin-top: var(--space-4);">
					<button class="btn btn-primary" id="retry-characters">Retry</button>
				</div>
			</div>
		`;

    const retryBtn = contentEl.querySelector("#retry-characters");
    retryBtn?.addEventListener("click", () => loadPage(state.page || 1));
  }

  prevBtn?.addEventListener("click", () => {
    if (state.info?.prev) {
      const prevPage = state.page > 1 ? state.page - 1 : 1;
      loadPage(prevPage);
    }
  });

  nextBtn?.addEventListener("click", () => {
    if (state.info?.next) {
      const nextPage = state.page + 1;
      loadPage(nextPage);
    }
  });

  function openCharacterModal(id) {
    const character = state.results.find((item) => item.id === id);
    if (!character) return;

    openModal({
      title: character.name,
      contentHTML: buildCharacterDetail(character),
    });
  }

  function buildCharacterDetail(c) {
    return `
      <div class="modal-post">
        <div style="display:flex; gap: var(--space-4); align-items: flex-start; margin-bottom: var(--space-4);">
          <img src="${c.image}" alt="${escapeHtml(c.name)}" style="width: 120px; height: 120px; object-fit: cover; border-radius: var(--radius-lg);" loading="lazy" />
          <div style="display: grid; gap: var(--space-2);">
            <h3>${escapeHtml(c.name)}</h3>
            <p style="color: var(--color-muted);">Status: ${escapeHtml(c.status)}</p>
            <p style="color: var(--color-muted);">Species: ${escapeHtml(c.species)}</p>
            <p style="color: var(--color-muted);">Gender: ${escapeHtml(c.gender)}</p>
          </div>
        </div>
        <div style="display:grid; gap: var(--space-2);">
          <p><strong>Origin:</strong> ${escapeHtml(c.origin?.name || "Unknown")}</p>
          <p><strong>Location:</strong> ${escapeHtml(c.location?.name || "Unknown")}</p>
        </div>
      </div>
    `;
  }

  const onSearch = debounce((event) => {
    const name = event.target.value.trim();
    updateFilters({ name }, true);
  }, 300);

  searchInput?.addEventListener("input", onSearch);
  speciesInput?.addEventListener("change", (event) => {
    const species = event.target.value.trim();
    updateFilters({ species }, true);
  });
  statusSelect?.addEventListener("change", (event) => {
    const status = event.target.value;
    updateFilters({ status }, true);
  });
  genderSelect?.addEventListener("change", (event) => {
    const gender = event.target.value;
    updateFilters({ gender }, true);
  });

  loadPage(1);
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
