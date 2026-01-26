import { getAllPosts } from "../services/posts.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";

const DEBOUNCE_MS = 300;

export function renderPostsPage(appEl) {
  if (!appEl) return;

  appEl.innerHTML = `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Posts</h1>
          <p style="color: var(--color-muted);">Latest posts from JSONPlaceholder.</p>
        </div>
        <div class="actions" style="width: min(320px, 100%);">
          <input
            id="posts-search"
            class="input"
            type="search"
            placeholder="Search posts by title..."
            aria-label="Search posts by title"
          />
        </div>
      </div>
      <div id="posts-content" class="section-block"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#posts-content");
  const searchInput = appEl.querySelector("#posts-search");

  let allPosts = [];
  let currentTerm = "";

  const filteredPosts = () => {
    if (!currentTerm) return allPosts;
    const term = currentTerm.toLowerCase();
    return allPosts.filter((post) => post.title.toLowerCase().includes(term));
  };

  async function loadPosts() {
    if (!contentEl) return;
    showLoader(contentEl);
    try {
      allPosts = (await getAllPosts()) || [];
      hideLoader();
      renderPosts(filteredPosts());
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load posts";
      showToast(message, "error");
      renderError(message);
    }
  }

  function renderPosts(posts) {
    if (!posts.length) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <h3>${currentTerm ? "No matches found" : "No posts available"}</h3>
          <p>${currentTerm ? "Try a different search." : "Try again later."}</p>
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <div class="cards-grid">
        ${posts
          .map(
            (post) => `
              <article class="card" aria-label="Post ${escapeHtml(post.title)}">
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(snippet(post.body))}</p>
                <small>Post ID: ${post.id}</small>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderError(message) {
    contentEl.innerHTML = `
      <div class="error-state">
        <h3>Unable to load posts</h3>
        <p>${escapeHtml(message)}</p>
        <div class="actions" style="justify-content: center; margin-top: var(--space-4);">
          <button class="btn btn-primary" id="retry-posts">Retry</button>
        </div>
      </div>
    `;

    const retryBtn = contentEl.querySelector("#retry-posts");
    retryBtn?.addEventListener("click", loadPosts);
  }

  const onSearch = debounce((event) => {
    currentTerm = event.target.value.trim();
    renderPosts(filteredPosts());
  }, DEBOUNCE_MS);

  searchInput?.addEventListener("input", onSearch);

  loadPosts();
}

function snippet(text = "", length = 120) {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
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
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
