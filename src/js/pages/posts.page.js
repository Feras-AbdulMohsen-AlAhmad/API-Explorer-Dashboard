import {
  getAllPosts,
  getPostById,
  getPostComments,
  createPost,
  updatePostPatch,
  updatePostPut,
} from "../services/posts.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

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
          <div class="actions" style="justify-content: flex-end; gap: var(--space-3);">
            <button type="submit" class="btn btn-primary">Create Post</button>
          </div>
        </form>
      </div>
      <div id="posts-content" class="section-block"></div>
    </section>
  `;

  const contentEl = appEl.querySelector("#posts-content");
  const searchInput = appEl.querySelector("#posts-search");
  const createForm = appEl.querySelector("#create-post-form");

  let allPosts = [];
  let currentTerm = "";
  let modalPost = null;
  let modalComments = [];

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
              <article
                class="card"
                data-post-id="${post.id}"
                tabindex="0"
                aria-label="Post ${escapeHtml(post.title)}"
              >
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(snippet(post.body))}</p>
                <small>Post ID: ${post.id}</small>
              </article>
            `,
          )
          .join("")}
      </div>
    `;

    attachCardHandlers();
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

  createForm?.addEventListener("submit", handleCreatePost);

  loadPosts();

  function attachCardHandlers() {
    const cards = contentEl.querySelectorAll("[data-post-id]");
    cards.forEach((card) => {
      const postId = card.getAttribute("data-post-id");
      if (!postId) return;
      card.addEventListener("click", () => openPostModal(postId));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPostModal(postId);
        }
      });
    });
  }

  async function openPostModal(postId) {
    openModal({
      title: `Post #${postId}`,
      contentHTML: `<div class="modal-post" id="modal-post"><p style="color: var(--color-muted);">Loading post...</p></div>`,
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
      renderModalContent(modalBody, post, comments || []);
    } catch (error) {
      hideLoader();
      const message =
        error instanceof Error ? error.message : "Failed to load post";
      showToast(message, "error");
      modalBody.innerHTML = `
        <div class="error-state">
          <h3>Unable to load post</h3>
          <p>${escapeHtml(message)}</p>
        </div>
      `;
    }
  }

  function renderModalContent(container, post, comments) {
    if (!container) return;
    modalPost = post;
    modalComments = comments;
    const commentsMarkup = comments.length
      ? comments
          .map(
            (comment) => `
              <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-3);">
                <div class="flex justify-between align-center" style="gap: var(--space-3);">
                  <strong>${escapeHtml(comment.name)}</strong>
                  <small style="color: var(--color-muted);">${escapeHtml(comment.email)}</small>
                </div>
                <p style="margin-top: var(--space-2);">${escapeHtml(comment.body)}</p>
              </div>
            `,
          )
          .join("")
      : `
          <div class="empty-state">
            <h3>No comments</h3>
            <p>Be the first to comment.</p>
          </div>
        `;

    container.innerHTML = `
      <div class="modal-post">
        <div class="actions" style="justify-content: flex-end; gap: var(--space-3); margin-bottom: var(--space-3);">
          <button class="btn btn-secondary" id="edit-post-btn">Edit</button>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p style="margin-bottom: var(--space-4);">${escapeHtml(post.body)}</p>
        <h4 style="margin-bottom: var(--space-3);">Comments (${comments.length})</h4>
        <div class="comments-list">${commentsMarkup}</div>
      </div>
    `;

    const editBtn = container.querySelector("#edit-post-btn");
    editBtn?.addEventListener("click", () => renderEditForm(container, post));
  }

  function renderEditForm(container, post) {
    if (!container) return;
    container.innerHTML = `
      <form id="edit-post-form" class="card" style="display: grid; gap: var(--space-4);">
        <div>
          <label for="edit-post-title">Title</label>
          <input id="edit-post-title" name="title" class="input" required value="${escapeHtml(post.title)}" />
        </div>
        <div>
          <label for="edit-post-body">Body</label>
          <textarea id="edit-post-body" name="body" class="input" rows="4" required>${escapeHtml(post.body)}</textarea>
        </div>
        <div class="actions" style="justify-content: flex-end; gap: var(--space-3);">
          <button type="button" class="btn btn-ghost" id="cancel-edit">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `;

    const form = container.querySelector("#edit-post-form");
    const cancelBtn = container.querySelector("#cancel-edit");

    cancelBtn?.addEventListener("click", () =>
      renderModalContent(container, modalPost || post, modalComments || []),
    );
    form?.addEventListener("submit", (event) => handleUpdatePost(event, post.id, container));
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    if (!createForm) return;

    const formData = new FormData(createForm);
    const title = formData.get("title")?.toString().trim() || "";
    const body = formData.get("body")?.toString().trim() || "";
    const userIdRaw = formData.get("userId")?.toString().trim() || "";
    const userId = Number(userIdRaw);

    if (!title || !body || !userIdRaw || Number.isNaN(userId) || userId < 1) {
      showToast("Please fill all fields with valid data", "error");
      return;
    }

    showLoader(createForm);
    try {
      const created = await createPost({ title, body, userId });
      allPosts = [created, ...allPosts];
      showToast("Post created", "success");
      createForm.reset();
      renderPosts(filteredPosts());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create post";
      showToast(message, "error");
    } finally {
      hideLoader(createForm);
    }
  }

  async function handleUpdatePost(event, id, container) {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const formData = new FormData(form);
    const title = formData.get("title")?.toString().trim() || "";
    const body = formData.get("body")?.toString().trim() || "";

    if (!title || !body) {
      showToast("Please fill all fields", "error");
      return;
    }

    showLoader(form);
    try {
      const updated = await updatePostPatch(id, { title, body });
      const merged = { ...(modalPost || {}), ...updated, title, body, id: Number(id) };
      modalPost = merged;
      updateLocalPost(merged);
      showToast("Post updated", "success");
      renderModalContent(container, merged, modalComments || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update post";
      showToast(message, "error");
    } finally {
      hideLoader(form);
    }
  }

  function updateLocalPost(updated) {
    allPosts = allPosts.map((post) =>
      post.id === updated.id ? { ...post, ...updated } : post,
    );
    renderPosts(filteredPosts());
  }
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
