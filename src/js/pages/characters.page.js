import { getCharacters } from "../services/rickmorty.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";

export function renderCharactersPage(appEl) {
  if (!appEl) return;

  appEl.innerHTML = `
		<section class="page">
			<div class="page-header">
				<div>
					<h1>Characters</h1>
					<p style="color: var(--color-muted);">Rick and Morty multiverse characters.</p>
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
  const prevBtn = appEl.querySelector("#prev-page");
  const nextBtn = appEl.querySelector("#next-page");

  let state = {
    page: 1,
    info: null,
    results: [],
  };

  async function loadPage(page = 1) {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      const data = await getCharacters({ page });
      state = {
        page,
        info: data?.info || null,
        results: data?.results || [],
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
							<article class="card" aria-label="${escapeHtml(character.name)}">
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
  }

  function renderPagination() {
    const hasPrev = Boolean(state.info?.prev);
    const hasNext = Boolean(state.info?.next);
    if (prevBtn) prevBtn.disabled = !hasPrev;
    if (nextBtn) nextBtn.disabled = !hasNext;
    if (prevBtn) prevBtn.textContent = hasPrev ? "Prev" : "Prev";
    if (nextBtn) nextBtn.textContent = hasNext ? "Next" : "Next";
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
