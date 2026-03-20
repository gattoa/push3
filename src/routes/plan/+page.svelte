<script lang="ts">
	import type { FullPlan, FullPlanDay, FullPlanSet } from '$lib/types/database';

	let { data } = $props();
	const plan: FullPlan = data.fullPlan;

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	let selectedDayIndex = $state(0);

	let sortedDays = $derived(
		[...plan.days].sort((a, b) => a.day_index - b.day_index)
	);

	let selectedDay: FullPlanDay = $derived(
		sortedDays.find(d => d.day_index === selectedDayIndex) ?? sortedDays[0]
	);

	function formatWeight(weight: number | null, unit: string): string {
		if (weight === null) return '—';
		return `${weight} ${unit}`;
	}

	function getSetStatus(set: FullPlanSet): 'completed' | 'skipped' | 'pending' | 'none' {
		if (!set.log) return 'none';
		return set.log.status as 'completed' | 'skipped' | 'pending';
	}

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
	<title>Push — Week {plan.plan.week_number} Plan</title>
</svelte:head>

<div class="plan-page">
	<header class="plan-header">
		<h1>Week {plan.plan.week_number}</h1>
		<span class="plan-status">{plan.plan.status}</span>
	</header>

	<!-- Day tabs -->
	<nav class="day-tabs">
		{#each sortedDays as day}
			{@const progress = getDayProgress(day)}
			<button
				class="day-tab"
				class:active={selectedDayIndex === day.day_index}
				class:rest={day.exercises.length === 0}
				class:done={progress.total > 0 && progress.done === progress.total}
				onclick={() => selectedDayIndex = day.day_index}
			>
				<span class="day-abbrev">{DAY_NAMES[day.day_index]?.slice(0, 3)}</span>
				<span class="day-label">{day.split_label}</span>
				{#if progress.total > 0}
					<span class="day-progress">{progress.done}/{progress.total}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<!-- Day detail -->
	<div class="day-detail">
		<div class="day-heading">
			<h2>{DAY_NAMES[selectedDay.day_index]}</h2>
			<span class="split-badge">{selectedDay.split_label}</span>
		</div>

		{#if selectedDay.exercises.length === 0}
			<div class="rest-state">
				<p>Rest day. Recover and prepare for your next session.</p>
			</div>
		{:else}
			{@const dayProgress = getDayProgress(selectedDay)}
			<a href="/workout/{selectedDay.day_index}" class="start-workout-btn">
				{#if dayProgress.total > 0 && dayProgress.done === dayProgress.total}
					Review Workout
				{:else if dayProgress.done > 0}
					Continue Workout
				{:else}
					Start Workout
				{/if}
			</a>

			<div class="exercise-list">
				{#each selectedDay.exercises.sort((a, b) => a.order_index - b.order_index) as exercise, i}
					<div class="exercise-card">
						<div class="exercise-header">
							<span class="exercise-number">{i + 1}</span>
							<div class="exercise-info">
								<h3 class="exercise-name">{exercise.exercise_name}</h3>
								{#if exercise.notes}
									<p class="exercise-notes">{exercise.notes}</p>
								{/if}
							</div>
						</div>

						<div class="sets-table">
							<div class="sets-header">
								<span>Set</span>
								<span>Target</span>
								<span>Actual</span>
								<span class="col-status-header"></span>
							</div>
							{#each exercise.sets.sort((a, b) => a.set_number - b.set_number) as set}
								{@const status = getSetStatus(set)}
								<div class="set-row" class:completed={status === 'completed'} class:skipped={status === 'skipped'}>
									<span class="set-num">{set.set_number}</span>
									<span class="set-target">
										{set.target_reps} × {formatWeight(set.target_weight, 'lb')}
									</span>
									<span class="set-actual">
										{#if set.log && status === 'completed'}
											{set.log.actual_reps ?? '—'} × {set.log.actual_weight != null ? `${set.log.actual_weight} lb` : '—'}
										{:else if status === 'skipped'}
											<span class="skipped-text">Skipped</span>
										{:else}
											—
										{/if}
									</span>
									<span class="col-status">
										{#if status === 'completed'}
											<span class="status-icon completed-icon">&#10003;</span>
										{:else if status === 'skipped'}
											<span class="status-icon skipped-icon">&#10005;</span>
										{/if}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.start-workout-btn {
		display: block;
		text-align: center;
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: var(--color-accent);
		color: #0a0a0a;
		font-family: var(--font-body);
		font-size: 0.9rem;
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.start-workout-btn:hover {
		background: var(--color-accent-hover);
	}

	.plan-page {
		min-height: 100vh;
		min-height: 100dvh;
		padding: 1rem 1rem 2rem;
		max-width: 480px;
		margin: 0 auto;
	}

	.plan-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 1.25rem;
		padding: 0 0.25rem;
	}

	.plan-header h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
	}

	.plan-status {
		font-family: var(--font-display);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-accent);
		background: rgba(34, 197, 94, 0.1);
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
	}

	/* Day tabs */
	.day-tabs {
		display: flex;
		gap: 0.35rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
		margin-bottom: 1.25rem;
		scrollbar-width: none;
	}

	.day-tabs::-webkit-scrollbar {
		display: none;
	}

	.day-tab {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.5rem 0.25rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s ease;
		color: var(--color-text);
		font-family: var(--font-body);
	}

	.day-tab.active {
		border-color: var(--color-accent);
		background: rgba(34, 197, 94, 0.08);
	}

	.day-tab.rest {
		opacity: 0.5;
	}

	.day-tab.rest.active {
		opacity: 1;
	}

	.day-abbrev {
		font-family: var(--font-display);
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.day-label {
		font-size: 0.6rem;
		color: var(--color-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	/* Day detail */
	.day-heading {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding: 0 0.25rem;
	}

	.day-heading h2 {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 700;
	}

	.split-badge {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		background: var(--color-surface);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.rest-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	/* Exercise cards */
	.exercise-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.exercise-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 1rem;
	}

	.exercise-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.exercise-number {
		font-family: var(--font-display);
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-accent);
		background: rgba(34, 197, 94, 0.1);
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.exercise-info {
		flex: 1;
		min-width: 0;
	}

	.exercise-name {
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: capitalize;
		line-height: 1.3;
	}

	.exercise-notes {
		font-size: 0.78rem;
		color: var(--color-text-muted);
		margin-top: 0.2rem;
		font-style: italic;
	}

	.day-tab.done {
		border-color: var(--color-accent);
		background: rgba(34, 197, 94, 0.06);
	}

	.day-progress {
		font-family: var(--font-display);
		font-size: 0.55rem;
		color: var(--color-accent);
		letter-spacing: 0.02em;
	}

	/* Sets table */
	.sets-table {
		font-size: 0.82rem;
	}

	.sets-header {
		display: grid;
		grid-template-columns: 32px 1fr 1fr 24px;
		gap: 0.5rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.set-row {
		display: grid;
		grid-template-columns: 32px 1fr 1fr 24px;
		gap: 0.5rem;
		padding: 0.4rem 0;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.03);
		transition: opacity 0.15s ease;
	}

	.set-row:last-child {
		border-bottom: none;
	}

	.set-row.completed {
		background: rgba(34, 197, 94, 0.04);
	}

	.set-row.skipped {
		opacity: 0.4;
	}

	.set-num {
		color: var(--color-text-muted);
		font-family: var(--font-display);
		font-size: 0.75rem;
	}

	.set-target {
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.set-actual {
		font-weight: 500;
		font-size: 0.8rem;
	}

	.skipped-text {
		color: var(--color-text-muted);
		font-style: italic;
		font-size: 0.75rem;
	}

	.col-status-header {
		width: 24px;
	}

	.col-status {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.status-icon {
		font-size: 0.7rem;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.completed-icon {
		color: var(--color-accent);
		background: rgba(34, 197, 94, 0.12);
	}

	.skipped-icon {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}
</style>
