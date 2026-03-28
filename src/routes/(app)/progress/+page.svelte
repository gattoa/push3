<script lang="ts">
</script>

<svelte:head>
	<title>Push — Progress</title>
</svelte:head>

<div class="progress-page">
	<header class="progress-header">
		<h1>Progress</h1>
	</header>
	<div class="placeholder">
		<p>Your progress starts with your first workout.</p>
	</div>
</div>

<style>
	.progress-page {
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: var(--page-gutter);
	}

	.progress-header {
		padding: var(--space-4) 0 var(--space-2);
	}

	.progress-header h1 {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		color: var(--color-text);
	}

	.placeholder {
		text-align: center;
		padding: var(--space-12) var(--space-4);
		color: var(--color-text-tertiary);
		font-size: var(--text-base);
	}
</style>
