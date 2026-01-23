export function renderCountriesPage(container) {
  if (!container) return;
  container.innerHTML = `
		<section class="page">
			<div class="page-header">
				<h1>Countries</h1>
			</div>
			<div class="empty-state">
				<h3>Countries</h3>
				<p>Content coming soon.</p>
			</div>
		</section>
	`;
}
