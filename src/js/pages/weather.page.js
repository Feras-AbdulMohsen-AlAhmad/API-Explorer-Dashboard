export function renderWeatherPage(container) {
  if (!container) return;
  container.innerHTML = `
		<section class="page">
			<div class="page-header">
				<h1>Weather</h1>
			</div>
			<div class="empty-state">
				<h3>Weather</h3>
				<p>Content coming soon.</p>
			</div>
		</section>
	`;
}
