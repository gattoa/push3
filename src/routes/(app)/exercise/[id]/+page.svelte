<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
	import type { Exercise } from '$lib/types/exercise';

	let { data } = $props();
	const exercise = $derived(data.exercise as Exercise);

	let ready = $state(false);

	$effect(() => {
		// Trigger entrance animations after mount
		requestAnimationFrame(() => {
			ready = true;
		});
	});

	function capitalize(str: string): string {
		return str.replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<svelte:head>
	<title>Push — {capitalize(exercise.name)}</title>
</svelte:head>

<div class="exercise-page">
	<header class="exercise-header" class:push-up={ready} style="--d:0">
		<button class="back-btn" onclick={() => history.back()} aria-label="Go back">
			<ChevronLeft size={20} />
		</button>
		<h1 class="exercise-title">{exercise.name}</h1>
	</header>

	<div class="gif-container" class:push-up={ready} style="--d:1">
		<img src={exercise.gifUrl} alt="{exercise.name} demonstration" loading="lazy" />
	</div>

	<div class="meta-group" class:push-up={ready} style="--d:2">
		<div class="meta-block">
			<h3 class="meta-label">Muscles</h3>
			<p class="meta-value">{exercise.target}</p>
			{#if exercise.secondaryMuscles.length > 0}
				<p class="meta-secondary">{exercise.secondaryMuscles.join(', ')}</p>
			{/if}
		</div>
		<div class="meta-block">
			<h3 class="meta-label">Equipment</h3>
			<p class="meta-value">{exercise.equipment}</p>
		</div>
	</div>

	{#if exercise.instructions.length > 0}
		<div class="detail-section" class:push-up={ready} style="--d:3">
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
	/* ═══ Page Layout ═══ */
	.exercise-page {
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: var(--page-pad-top) var(--page-gutter) var(--page-pad-bottom);
		min-height: 100dvh;
	}

	/* ═══ Header (grid: back button + title) ═══ */
	.exercise-header {
		display: grid;
		grid-template-columns: 44px 1fr;
		gap: var(--space-3);
		align-items: center;
		margin-bottom: var(--space-4);
	}

	.back-btn {
		background: none;
		border: 1.5px solid var(--color-border);
		color: var(--color-text-secondary);
		width: 44px;
		height: 44px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--duration-normal) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.back-btn:hover {
		border-color: var(--color-border-strong);
		color: var(--color-text);
	}

	.back-btn:active {
		transform: scale(0.95);
	}

	.exercise-title {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-snug);
		text-transform: capitalize;
		min-width: 0;
	}

	/* ═══ GIF Container ═══ */
	.gif-container {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		margin-bottom: var(--space-6);
	}

	.gif-container img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: contain;
		display: block;
	}

	/* ═══ Metadata Group ═══ */
	.meta-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
	}

	.meta-label {
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-1);
	}

	.meta-value {
		font-size: var(--text-sm);
		color: var(--color-text);
		text-transform: capitalize;
	}

	.meta-secondary {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		margin-top: var(--space-0-5);
		text-transform: capitalize;
	}

	/* ═══ Primary Section ═══ */
	.detail-section {
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-3);
	}

	/* ═══ Instructions List ═══ */
	.instructions-list {
		display: grid;
		grid-template-columns: var(--space-6) 1fr;
		gap: var(--space-1) var(--space-2);
		row-gap: var(--space-3);
		list-style: none;
		padding-left: 0;
		counter-reset: steps;
		font-size: var(--text-base);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
	}

	.instructions-list li {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		counter-increment: steps;
	}

	.instructions-list li::before {
		content: counter(steps) '.';
		color: var(--color-activity);
		font-family: var(--font-mono);
		font-weight: var(--weight-bold);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
	}

	/* ═══ Entrance Animation ═══ */
	.push-up {
		animation: pushUp var(--duration-slow) var(--ease-out) calc(var(--d) * 60ms) both;
	}

	@keyframes pushUp {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
