export function renderCharactersPage(container) {
  if (!container) return;
  container.innerHTML = `
		<section class="page">
			<div class="page-header">
				<h1>Characters</h1>
			</div>
			<div class="empty-state">
				<h3>Characters</h3>
				<p>Content coming soon.</p>
			</div>
		</section>
	`;
}
