import { getAllPosts } from "../services/posts.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";

export async function renderPostsPage(container) {
  if (!container) return;

  container.innerHTML = `
    <section class="page">
      <div class="page-header">
        <h1>Posts</h1>
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
      <div id="posts-content"></div>
    </section>
  `;

  const contentEl = container.querySelector("#posts-content");
  const searchInput = container.querySelector("#posts-search");
  let allPosts = [];

  const renderList = (list) => {
    if (!list || list.length === 0) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <h3>No posts found</h3>
          <p>Try adjusting your search.</p>
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <div class="cards-grid">
        ${list
          .map(
            (post) => `
          <article class="card">
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.body)}</p>
            <small>Post ID: ${post.id}</small>
          </article>
        `,
          )
          .join("")}
      </div>
    `;
  };

  try {
    showLoader(contentEl);
    allPosts = (await getAllPosts()) || [];
    hideLoader();
    renderList(allPosts);
  } catch (error) {
    hideLoader();
    showToast(error.message || "Failed to load posts", "error");
    contentEl.innerHTML = `
      <div class="error-state">
        <h3>Error loading posts</h3>
        <p>${escapeHtml(error.message || "Something went wrong")}</p>
      </div>
    `;
    return;
  }

  const handleSearch = debounce((event) => {
    const term = event.target.value.trim().toLowerCase();
    const filtered = allPosts.filter((post) =>
      post.title.toLowerCase().includes(term),
    );
    renderList(filtered);
  }, 250);

  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
