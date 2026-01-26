import {
  getAllPosts,
  getPostById,
  getPostComments,
  createPost,
  updatePostPatch,
  updatePostPut,
  deletePost,
} from "../services/posts.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";
import { openModal, closeModal } from "../components/modal.js";

export async function renderPostsPage(container) {
  import { getAllPosts } from "../services/posts.service.js";
  import { showLoader, hideLoader } from "../components/loader.js";
  import { showToast } from "../components/toast.js";

  export function renderPostsPage(appEl) {
    if (!appEl) return;

    appEl.innerHTML = `
      <section class="page">
        <div class="page-header">
          <div>
            <h1>Posts</h1>
            <p style="color: var(--color-muted);">Latest posts from JSONPlaceholder.</p>
          </div>
        </div>
        <div id="posts-content" class="section-block"></div>
      </section>
    `;

    const contentEl = appEl.querySelector("#posts-content");

    async function loadPosts() {
      if (!contentEl) return;
      showLoader(contentEl);
      try {
        const posts = (await getAllPosts()) || [];
        hideLoader();
        renderPosts(posts);
      } catch (error) {
        hideLoader();
        const message = error instanceof Error ? error.message : "Failed to load posts";
        showToast(message, "error");
        renderError(message);
      }
    }

    function renderPosts(posts) {
      if (!posts.length) {
        contentEl.innerHTML = `
          <div class="empty-state">
            <h3>No posts available</h3>
            <p>Try again later.</p>
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
      renderList();
      closeModal();
      showToast("Post deleted", "success");
    } catch (error) {
      showToast(error.message || "Failed to delete post", "error");
    } finally {
      hideLoader(modalBody || document.body);
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
