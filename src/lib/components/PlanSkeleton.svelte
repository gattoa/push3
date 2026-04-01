<script lang="ts">
	let { trainingDays = [] }: { trainingDays: number[] } = $props();

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const trainingSet = $derived(new Set(trainingDays));
</script>

<div class="skeleton-list">
	{#each Array(7) as _, i}
		{@const isTraining = trainingSet.has(i)}
		<div class="skel-card" class:rest={!isTraining}>
			<div class="skel-top">
				<span class="skel-day-name">{DAY_NAMES[i]}</span>
			</div>

			{#if isTraining}
				<div class="skel-bar skel-split shimmer"></div>
				<div class="skel-stats">
					<div class="skel-bar skel-stat shimmer"></div>
					<div class="skel-bar skel-stat shimmer"></div>
				</div>
				<div class="skel-bar skel-progress shimmer"></div>
			{:else}
				<span class="skel-rest-label">Rest Day</span>
			{/if}
		</div>
	{/each}
</div>

<style>
	.skeleton-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.skel-card {
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		padding: 1rem;
	}

	.skel-card.rest {
		opacity: 0.6;
	}

	.skel-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.skel-day-name {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.skel-rest-label {
		font-size: 0.8rem;
		color: var(--color-text-tertiary);
		font-style: italic;
	}

	/* Shimmer bars */
	.skel-bar {
		border-radius: var(--radius-xs);
		position: relative;
		overflow: hidden;
	}

	.skel-split {
		width: 40%;
		height: 0.8rem;
		margin-bottom: 0.5rem;
	}

	.skel-stats {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.skel-stat {
		width: 4rem;
		height: 0.7rem;
	}

	.skel-progress {
		width: 100%;
		height: 3px;
	}

	/* Shimmer animation */
	.shimmer {
		background: var(--color-border-subtle);
	}

	.shimmer::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--color-border) 50%,
			transparent 100%
		);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
</style>
