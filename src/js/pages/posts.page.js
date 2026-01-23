export function renderPostsPage(container) {
  if (!container) return;
  container.innerHTML = `
		<section class="page">
			<div class="page-header">
				<h1>Posts</h1>
			</div>
			<div class="empty-state">
				<h3>Posts</h3>
				<p>Content coming soon.</p>
			</div>
		</section>
	`;
}
