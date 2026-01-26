import { getAllPosts } from "../services/posts.service.js";
import { showLoader, hideLoader } from "../components/loader.js";
import { showToast } from "../components/toast.js";

export async function renderPostsPage(container) {
  if (!container) return;

  container.innerHTML = `
    <section class="page">
      <div class="page-header">
        <h1>Posts</h1>
      </div>
      <div id="posts-content"></div>
    </section>
  `;

  const contentEl = container.querySelector("#posts-content");

  try {
    showLoader(contentEl);
    const posts = await getAllPosts();
    hideLoader();

    if (!posts || posts.length === 0) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <h3>No posts found</h3>
          <p>There are no posts available at the moment.</p>
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <div class="cards-grid">
        ${posts
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
  } catch (error) {
    hideLoader();
    showToast(error.message || "Failed to load posts", "error");
    contentEl.innerHTML = `
      <div class="error-state">
        <h3>Error loading posts</h3>
        <p>${escapeHtml(error.message || "Something went wrong")}</p>
      </div>
    `;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
