<script lang="ts">
	import type { FullPlan, FullPlanDay } from '$lib/types/database';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import { ClipboardCheck, Play } from 'lucide-svelte';
	import { page } from '$app/state';
	import AvatarMenu from '$lib/components/AvatarMenu.svelte';

	let { data } = $props();
	const plan = $derived(data.fullPlan as FullPlan | null);
	const todayIndex = $derived(data.todayIndex as number);
	const hasPreviousPlan = $derived(data.hasPreviousPlan as boolean);

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	let sortedDays = $derived(
		plan ? [...plan.days].sort((a, b) => a.day_index - b.day_index) : []
	);

	function getDayProgress(day: FullPlanDay): { done: number; total: number } {
		let total = 0;
		let done = 0;
		for (const ex of day.exercises) {
			for (const set of ex.sets) {
				total++;
				if (set.log && (set.log.status === 'completed' || set.log.status === 'skipped')) {
					done++;
				}
			}
		}
		return { done, total };
	}

</script>

<svelte:head>
	<title>Push — This Week</title>
</svelte:head>

<div class="agenda-page">
	<header class="agenda-header">
		<div class="header-bar">
			<div class="header-slot"></div>
			<SegmentedControl active="week" />
			<AvatarMenu />
		</div>
		<h1 class="header-title">This Week</h1>
	</header>

	{#if plan}
		<div class="day-list">
			{#each sortedDays as day}
				{@const progress = getDayProgress(day)}
				{@const isToday = day.day_index === todayIndex}
				{@const isRest = day.exercises.length === 0}
				{@const isComplete = progress.total > 0 && progress.done === progress.total}
				<a
					href="/workout/{day.day_index}"
					class="day-card"
					class:today={isToday}
					class:rest={isRest}
					class:complete={isComplete}
				>
					<div class="day-card-top">
						<span class="day-name">{DAY_NAMES[day.day_index]}</span>
						{#if isToday}
							<span class="today-badge">Today</span>
						{/if}
					</div>

					{#if isRest}
						<span class="rest-label">Rest Day</span>
					{:else}
						<span class="split-label">{day.split_label}</span>
						<div class="day-card-stats">
							<span>{day.exercises.length} exercises</span>
							<span class="dot-sep">&middot;</span>
							<span>{progress.total} sets</span>
						</div>
						{#if progress.total > 0}
							<div class="mini-progress">
								<div class="mini-progress-bar">
									<div
										class="mini-progress-fill"
										style="width: {(progress.done / progress.total) * 100}%"
									></div>
								</div>
								<span class="mini-progress-text">
									{#if isComplete}
										&#10003;
									{:else}
										{progress.done}/{progress.total}
									{/if}
								</span>
							</div>
						{/if}
					{/if}
				</a>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<div class="empty-icon">
				{#if hasPreviousPlan}
					<ClipboardCheck size={32} />
				{:else}
					<Play size={32} />
				{/if}
			</div>
			<h2 class="empty-title">No plan for this week</h2>
			<p class="empty-desc">
				{#if hasPreviousPlan}
					Check in on last week to generate your next plan.
				{:else}
					Generate your first training plan to get started.
				{/if}
			</p>
			<a
				href={hasPreviousPlan ? '/check-in' : '/plan/generate'}
				class="empty-cta"
			>
				{#if hasPreviousPlan}
					Check In
				{:else}
					Generate Plan
				{/if}
			</a>
		</div>
	{/if}
</div>

<style>
	.agenda-page {
		min-height: 100vh;
		min-height: 100dvh;
		padding: calc(var(--safe-top) + 1rem) 1rem calc(var(--safe-bottom) + 2rem);
		max-width: 480px;
		margin: 0 auto;
	}

	.agenda-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: 1.25rem;
	}

	.header-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-slot {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}

	.header-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		text-align: center;
	}

	/* Day cards */
	.day-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.day-card {
		display: block;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		padding: 1rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.15s ease;
	}

	.day-card:hover {
		background: var(--color-surface-hover);
	}

	.day-card.today {
		border-color: var(--color-accent);
	}

	.day-card.rest {
		opacity: 0.6;
	}

	.day-card.rest:hover {
		opacity: 0.8;
	}

	.day-card-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.day-name {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 700;
	}

	.today-badge {
		font-family: var(--font-display);
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-accent);
		background: rgba(34, 197, 94, 0.1);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.split-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-transform: capitalize;
		display: block;
		margin-bottom: 0.5rem;
	}

	.rest-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	.day-card-stats {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.dot-sep {
		opacity: 0.5;
	}

	/* Mini progress bar */
	.mini-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mini-progress-bar {
		flex: 1;
		height: 3px;
		background: var(--color-border);
		border-radius: 1.5px;
		overflow: hidden;
	}

	.mini-progress-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: 1.5px;
		transition: width 0.3s ease;
	}

	.mini-progress-text {
		font-family: var(--font-display);
		font-size: 0.65rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.day-card.complete .mini-progress-text {
		color: var(--color-accent);
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: var(--space-16) var(--space-4);
		gap: var(--space-3);
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		border-radius: var(--radius-full);
		background: var(--color-activity-muted);
		color: var(--color-activity);
		margin-bottom: var(--space-2);
	}

	.empty-title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-text);
	}

	.empty-desc {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		max-width: 260px;
		line-height: var(--leading-normal);
	}

	.empty-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-3) var(--space-6);
		background: var(--color-activity);
		color: var(--color-text-inverse);
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		border-radius: var(--radius);
		text-decoration: none;
		margin-top: var(--space-2);
		transition: opacity var(--duration-normal) var(--ease-out);
	}

	.empty-cta:hover {
		opacity: 0.9;
	}
</style>
