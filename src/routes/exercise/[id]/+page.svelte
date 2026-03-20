<script lang="ts">
	import type { Exercise } from '$lib/types/exercise';

	let { data } = $props();
	const exercise: Exercise = data.exercise;
</script>

<svelte:head>
	<title>Push — {exercise.name}</title>
</svelte:head>

<div class="exercise-page">
	<header class="exercise-header">
		<button class="back-btn" onclick={() => history.back()}>&larr;</button>
	</header>

	<div class="gif-container">
		<img
			src={exercise.gifUrl}
			alt={exercise.name}
			loading="lazy"
		/>
	</div>

	<div class="exercise-meta">
		<h1 class="exercise-title">{exercise.name}</h1>
		<div class="tags">
			<span class="tag">{exercise.equipment}</span>
			<span class="tag-sep">&middot;</span>
			<span class="tag">{exercise.target}</span>
		</div>
		{#if exercise.secondaryMuscles.length > 0}
			<p class="secondary-muscles">
				Secondary: {exercise.secondaryMuscles.join(', ')}
			</p>
		{/if}
	</div>

	{#if exercise.instructions.length > 0}
		<div class="instructions-section">
			<h2 class="section-title">Instructions</h2>
			<ol class="instructions-list">
				{#each exercise.instructions as step}
					<li>{step}</li>
				{/each}
			</ol>
		</div>
	{/if}
</div>

<style>
	.exercise-page {
		min-height: 100vh;
		min-height: 100dvh;
		padding: 1rem 1rem 4rem;
		max-width: 480px;
		margin: 0 auto;
	}

	.exercise-header {
		margin-bottom: 1rem;
	}

	.back-btn {
		background: none;
		border: 1.5px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: 1.1rem;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.back-btn:hover {
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	.gif-container {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		margin-bottom: 1.25rem;
	}

	.gif-container img {
		width: 100%;
		display: block;
	}

	.exercise-meta {
		margin-bottom: 1.5rem;
	}

	.exercise-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		text-transform: capitalize;
		line-height: 1.3;
		margin-bottom: 0.5rem;
	}

	.tags {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-transform: capitalize;
	}

	.tag-sep {
		opacity: 0.5;
	}

	.secondary-muscles {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 0.4rem;
		text-transform: capitalize;
	}

	.instructions-section {
		border-top: 1px solid var(--color-border);
		padding-top: 1.25rem;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.instructions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-left: 1.25rem;
		font-size: 0.88rem;
		line-height: 1.6;
		color: var(--color-text);
	}

	.instructions-list li::marker {
		color: var(--color-accent);
		font-family: var(--font-display);
		font-weight: 700;
	}
</style>
