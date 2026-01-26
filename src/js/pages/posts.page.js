import {
  getAllPosts,
  getPostById,
  getPostComments,
  createPost,
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
      <div class="section-block">
        <form id="create-post-form" class="card" style="display: grid; gap: var(--space-4);">
          <div>
            <label for="post-title">Title</label>
            <input id="post-title" name="title" class="input" required />
          </div>
          <div>
            <label for="post-body">Body</label>
            <textarea id="post-body" name="body" class="input" rows="3" required></textarea>
          </div>
          <div>
            <label for="post-user">User ID</label>
            <input id="post-user" name="userId" class="input" type="number" min="1" required />
          </div>
          <div class="actions" style="justify-content: flex-end;">
            <button type="submit" class="btn btn-primary">Create Post</button>
          </div>
        </form>
      </div>
      <div id="posts-content"></div>
    </section>
  `;

  const contentEl = container.querySelector("#posts-content");
  const searchInput = container.querySelector("#posts-search");
  const createForm = container.querySelector("#create-post-form");
  let allPosts = [];
  let currentTerm = "";

  const getFilteredPosts = () => {
    if (!currentTerm) return allPosts;
    const term = currentTerm.toLowerCase();
    return allPosts.filter((post) => post.title.toLowerCase().includes(term));
  };

  const renderList = () => {
    const list = getFilteredPosts();
    if (!list || list.length === 0) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <h3>No posts found</h3>
          <p>${currentTerm ? "Try adjusting your search." : "There are no posts available at the moment."}</p>
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
    renderList();
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
    currentTerm = event.target.value.trim();
    renderList();
  }, 250);

  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  if (createForm) {
    createForm.addEventListener("submit", handleCreatePost);
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

  async function handleCreatePost(event) {
    event.preventDefault();
    const formData = new FormData(createForm);
    const title = (formData.get("title") || "").toString().trim();
    const body = (formData.get("body") || "").toString().trim();
    const userId = Number(formData.get("userId"));

    if (!title || !body || Number.isNaN(userId)) {
      showToast("Please fill in all fields", "error");
      return;
    }

    showLoader(contentEl);
    try {
      const created = await createPost({ title, body, userId });
      // Simulate insert at the top
      allPosts = [created, ...allPosts];
      renderList();
      showToast("Post created", "success");
      createForm.reset();
    } catch (error) {
      showToast(error.message || "Failed to create post", "error");
    } finally {
      hideLoader();
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
