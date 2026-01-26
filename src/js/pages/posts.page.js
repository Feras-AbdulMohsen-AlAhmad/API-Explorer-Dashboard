import {
  getAllPosts,
  getPostById,
  getPostComments,
} from "../services/posts.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

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
          <article class="card" data-post-id="${post.id}" tabindex="0">
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.body)}</p>
            <small>Post ID: ${post.id}</small>
          </article>
        `,
          )
          .join("")}
      </div>
    `;
    attachCardClicks();
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

  function attachCardClicks() {
    const cards = contentEl.querySelectorAll("[data-post-id]");
    cards.forEach((card) => {
      card.addEventListener("click", () =>
        openPostDetails(card.dataset.postId),
      );
      card.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          openPostDetails(card.dataset.postId);
        }
      });
    });
  }

  async function openPostDetails(postId) {
    if (!postId) return;
    openModal({
      title: `Post #${postId}`,
      contentHTML: `<div class="modal-post" id="modal-post"></div>`,
    });

    const modalBody = document.querySelector(".modal-body");
    if (!modalBody) return;

    showLoader(modalBody);
    try {
      const [post, comments] = await Promise.all([
        getPostById(postId),
        getPostComments(postId),
      ]);
      hideLoader();

      modalBody.innerHTML = `
        <div class="modal-post">
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.body)}</p>
          <h4>Comments (${comments.length})</h4>
          <div class="comments-list">
            ${comments
              .map(
                (comment) => `
                  <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-3);">
                    <strong>${escapeHtml(comment.name)}</strong>
                    <p>${escapeHtml(comment.body)}</p>
                    <small>${escapeHtml(comment.email)}</small>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      `;
    } catch (error) {
      hideLoader();
      showToast(error.message || "Failed to load post", "error");
      modalBody.innerHTML = `
        <div class="error-state">
          <h3>Failed to load post</h3>
          <p>${escapeHtml(error.message || "Something went wrong")}</p>
        </div>
      `;
    }
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
