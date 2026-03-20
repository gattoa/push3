<script lang="ts">
	import type { FullPlanDay, FullPlanExercise, FullPlanSet } from '$lib/types/database';

	let { data } = $props();
	const day: FullPlanDay = data.day;
	const unitPref: string = data.unitPref;
	const weekNumber: number = data.plan.week_number;

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	// Local state for each set, keyed by planned_set_id
	let setStates = $state<Record<string, {
		weight: string;
		reps: string;
		status: 'pending' | 'completed' | 'skipped';
		saving: boolean;
		logId: string | null;
	}>>({});

	// Initialize state from existing logs (persisted data)
	$effect(() => {
		const initial: typeof setStates = {};
		for (const exercise of day.exercises) {
			for (const set of exercise.sets) {
				const log = set.log;
				initial[set.id] = {
					weight: log?.actual_weight?.toString() ?? '',
					reps: log?.actual_reps?.toString() ?? '',
					status: (log?.status as 'pending' | 'completed' | 'skipped') ?? 'pending',
					saving: false,
					logId: log?.id ?? null
				};
			}
		}
		setStates = initial;
	});

	// Derived stats
	let totalSets = $derived(
		day.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
	);

	let completedSets = $derived(
		Object.values(setStates).filter((s) => s.status === 'completed').length
	);

	let skippedSets = $derived(
		Object.values(setStates).filter((s) => s.status === 'skipped').length
	);

	let totalVolume = $derived(
		Object.values(setStates).reduce((sum, s) => {
			if (s.status === 'completed' && s.weight && s.reps) {
				return sum + parseFloat(s.weight) * parseInt(s.reps, 10);
			}
			return sum;
		}, 0)
	);

	let allDone = $derived(completedSets + skippedSets === totalSets && totalSets > 0);

	async function saveSet(setId: string, status: 'completed' | 'skipped' | 'pending') {
		const s = setStates[setId];
		if (!s || s.saving) return;

		setStates[setId] = { ...s, saving: true, status };

		try {
			const res = await fetch('/api/log-set', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					planned_set_id: setId,
					actual_weight: s.weight ? parseFloat(s.weight) : null,
					actual_reps: s.reps ? parseInt(s.reps, 10) : null,
					status
				})
			});

			const result = await res.json();
			if (res.ok) {
				setStates[setId] = { ...setStates[setId], saving: false, logId: result.id };
			} else {
				console.error('Failed to save set:', result.error);
				setStates[setId] = { ...setStates[setId], saving: false, status: s.status };
			}
		} catch (e) {
			console.error('Network error saving set:', e);
			setStates[setId] = { ...setStates[setId], saving: false, status: s.status };
		}
	}

	function handleComplete(setId: string) {
		const s = setStates[setId];
		if (!s) return;

		if (s.status === 'completed') {
			// Toggle back to pending
			saveSet(setId, 'pending');
		} else {
			saveSet(setId, 'completed');
		}
	}

	function handleSkip(setId: string) {
		const s = setStates[setId];
		if (!s) return;

		if (s.status === 'skipped') {
			saveSet(setId, 'pending');
		} else {
			saveSet(setId, 'skipped');
		}
	}
</script>

<svelte:head>
	<title>Push — {DAY_NAMES[day.day_index]} Workout</title>
</svelte:head>

<div class="workout-page">
	<header class="workout-header">
		<a href="/plan" class="back-link">&larr; Plan</a>
		<div class="header-info">
			<h1>{DAY_NAMES[day.day_index]}</h1>
			<span class="split-badge">{day.split_label}</span>
		</div>
		<span class="week-label">Week {weekNumber}</span>
	</header>

	<!-- Progress bar -->
	<div class="progress-section">
		<div class="progress-bar">
			<div
				class="progress-fill"
				style="width: {totalSets > 0 ? ((completedSets + skippedSets) / totalSets) * 100 : 0}%"
			></div>
		</div>
		<span class="progress-text">{completedSets + skippedSets} / {totalSets} sets</span>
	</div>

	{#if day.exercises.length === 0}
		<div class="rest-state">
			<p>Rest day. No exercises prescribed.</p>
			<a href="/plan" class="btn btn-secondary">Back to Plan</a>
		</div>
	{:else}
		<div class="exercise-list">
			{#each day.exercises.sort((a, b) => a.order_index - b.order_index) as exercise, i}
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
							<span class="col-set">Set</span>
							<span class="col-target">Target</span>
							<span class="col-weight">Weight ({unitPref})</span>
							<span class="col-reps">Reps</span>
							<span class="col-actions"></span>
						</div>

						{#each exercise.sets.sort((a, b) => a.set_number - b.set_number) as set}
							{@const s = setStates[set.id]}
							{#if s}
								<div
									class="set-row"
									class:completed={s.status === 'completed'}
									class:skipped={s.status === 'skipped'}
								>
									<span class="col-set set-num">{set.set_number}</span>

									<span class="col-target target-info">
										{set.target_reps}
										{#if set.target_weight !== null}
											× {set.target_weight}
										{/if}
									</span>

									<span class="col-weight">
										<input
											type="number"
											inputmode="decimal"
											placeholder={set.target_weight !== null ? String(set.target_weight) : '—'}
											bind:value={s.weight}
											disabled={s.status === 'skipped'}
											class="input-field"
											class:has-value={s.weight !== ''}
										/>
									</span>

									<span class="col-reps">
										<input
											type="number"
											inputmode="numeric"
											placeholder={String(set.target_reps)}
											bind:value={s.reps}
											disabled={s.status === 'skipped'}
											class="input-field"
											class:has-value={s.reps !== ''}
										/>
									</span>

									<span class="col-actions">
										<button
											class="action-btn complete-btn"
											class:active={s.status === 'completed'}
											disabled={s.saving}
											onclick={() => handleComplete(set.id)}
											title="Mark completed"
										>
											&#10003;
										</button>
										<button
											class="action-btn skip-btn"
											class:active={s.status === 'skipped'}
											disabled={s.saving}
											onclick={() => handleSkip(set.id)}
											title="Skip set"
										>
											&#10005;
										</button>
									</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Workout summary (shows when all sets are done) -->
		{#if allDone}
			<div class="summary-card">
				<h3>Workout Complete</h3>
				<div class="summary-stats">
					<div class="stat">
						<span class="stat-value">{completedSets}</span>
						<span class="stat-label">Sets Done</span>
					</div>
					<div class="stat">
						<span class="stat-value">{skippedSets}</span>
						<span class="stat-label">Skipped</span>
					</div>
					<div class="stat">
						<span class="stat-value">{totalVolume.toLocaleString()}</span>
						<span class="stat-label">Volume ({unitPref})</span>
					</div>
				</div>
				<a href="/plan" class="btn btn-primary">Back to Plan</a>
			</div>
		{/if}
	{/if}
</div>

<style>
	.workout-page {
		min-height: 100vh;
		min-height: 100dvh;
		padding: 1rem 1rem 6rem;
		max-width: 480px;
		margin: 0 auto;
	}

	.workout-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.back-link {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
		padding: 0.25rem 0;
		flex-shrink: 0;
	}

	.back-link:hover {
		color: var(--color-text);
	}

	.header-info {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.workout-header h1 {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
	}

	.split-badge {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		background: var(--color-surface);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		white-space: nowrap;
	}

	.week-label {
		font-family: var(--font-display);
		font-size: 0.65rem;
		color: var(--color-text-muted);
		letter-spacing: 0.05em;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	/* Progress */
	.progress-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.progress-bar {
		flex: 1;
		height: 4px;
		background: var(--color-border);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-family: var(--font-display);
		font-size: 0.7rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	/* Rest state */
	.rest-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	/* Exercise cards */
	.exercise-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	.exercise-info { flex: 1; min-width: 0; }

	.exercise-name {
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: capitalize;
		line-height: 1.3;
	}

	.exercise-notes {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.2rem;
		font-style: italic;
	}

	/* Sets table */
	.sets-table {
		font-size: 0.8rem;
	}

	.sets-header {
		display: grid;
		grid-template-columns: 32px 60px 1fr 1fr 64px;
		gap: 0.4rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.set-row {
		display: grid;
		grid-template-columns: 32px 60px 1fr 1fr 64px;
		gap: 0.4rem;
		padding: 0.5rem 0;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.03);
		transition: opacity 0.15s ease;
	}

	.set-row:last-child { border-bottom: none; }

	.set-row.completed {
		background: rgba(34, 197, 94, 0.04);
	}

	.set-row.skipped {
		opacity: 0.4;
	}

	.set-num {
		font-family: var(--font-display);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.target-info {
		font-size: 0.72rem;
		color: var(--color-text-muted);
	}

	/* Input fields */
	.input-field {
		width: 100%;
		padding: 0.45rem 0.4rem;
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: 0.85rem;
		text-align: center;
		outline: none;
		transition: border-color 0.15s ease;
		-moz-appearance: textfield;
	}

	.input-field::-webkit-outer-spin-button,
	.input-field::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.input-field:focus {
		border-color: var(--color-accent);
	}

	.input-field.has-value {
		border-color: rgba(34, 197, 94, 0.3);
	}

	.input-field:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.input-field::placeholder {
		color: var(--color-text-muted);
		opacity: 0.4;
	}

	/* Action buttons */
	.col-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: center;
	}

	.action-btn {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1.5px solid var(--color-border);
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
		padding: 0;
	}

	.action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.complete-btn.active {
		background: rgba(34, 197, 94, 0.15);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.complete-btn:hover:not(:disabled):not(.active) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.skip-btn.active {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
		color: #ef4444;
	}

	.skip-btn:hover:not(:disabled):not(.active) {
		border-color: #ef4444;
		color: #ef4444;
	}

	/* Summary */
	.summary-card {
		margin-top: 1.5rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-accent);
		border-radius: var(--radius);
		padding: 1.5rem;
		text-align: center;
	}

	.summary-card h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-accent);
		margin-bottom: 1rem;
	}

	.summary-stats {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 1.25rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
	}

	.stat-label {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-primary {
		background: var(--color-accent);
		color: #0a0a0a;
	}

	.btn-primary:hover {
		background: var(--color-accent-hover);
	}

	.btn-secondary {
		background: transparent;
		color: var(--color-text-muted);
		border: 1.5px solid var(--color-border);
	}

	.btn-secondary:hover {
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}
</style>
