<script lang="ts">
	import type { FullPlan, FullPlanDay } from '$lib/types/database';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import PlanSkeleton from '$lib/components/PlanSkeleton.svelte';
	import { ClipboardCheck, Check } from 'lucide-svelte';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { addToast } from '$lib/stores/toast.svelte';
	import AvatarMenu from '$lib/components/AvatarMenu.svelte';

	let { data } = $props();
	const plan = $derived(data.fullPlan as FullPlan | null);
	const todayIndex = $derived(data.todayIndex as number);
	const hasPreviousPlan = $derived(data.hasPreviousPlan as boolean);
	const serverGenStatus = $derived(data.generationStatus as 'none' | 'generating' | 'ready');
	const trainingDays = $derived(data.trainingDays as number[]);

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	// ── Generation state ──────────────────────────────────────
	let genState = $state<'idle' | 'generating' | 'error'>('idle');
	let genError = $state('');
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let pollCount = $state(0);
	const MAX_POLLS = 20; // 20 × 3s = 60s timeout

	const isGenerating = $derived(genState === 'generating');

	// On mount: if server says generating or no plan exists (and no previous plan to check-in from), start generation
	$effect(() => {
		if (plan) {
			// Plan exists — nothing to do
			genState = 'idle';
			return;
		}

		if (serverGenStatus === 'generating') {
			// Plan is already being generated server-side — just poll
			genState = 'generating';
			startPolling();
		} else if (serverGenStatus === 'none' && !hasPreviousPlan) {
			// First-time user with no plan — trigger generation
			triggerGeneration();
		}
	});

	onDestroy(() => {
		stopPolling();
	});

	async function triggerGeneration() {
		genState = 'generating';
		genError = '';
		pollCount = 0;

		try {
			const res = await fetch('/api/generate-plan', { method: 'POST' });
			const data = await res.json();

			if (!res.ok) {
				// 409 = plan already exists or is generating — just poll for it
				if (res.status === 409) {
					startPolling();
					return;
				}
				// 429 = rate limited
				if (res.status === 429) {
					genState = 'error';
					genError = data.error || 'Please wait before generating another plan.';
					return;
				}
				genState = 'error';
				genError = data.error || 'Generation failed. Please try again.';
				return;
			}

			// POST succeeded — plan should be saving. Poll for active status.
			startPolling();
		} catch {
			// Network error — plan might still be generating server-side. Poll to check.
			startPolling();
		}
	}

	function startPolling() {
		stopPolling();
		pollCount = 0;
		pollTimer = setInterval(pollForPlan, 3000);
	}

	function stopPolling() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	async function pollForPlan() {
		pollCount++;

		if (pollCount > MAX_POLLS) {
			stopPolling();
			genState = 'error';
			genError = 'Plan generation is taking longer than expected. Please refresh the page.';
			return;
		}

		try {
			const res = await fetch('/api/generate-plan');
			const data = await res.json();

			if (data.plan && data.plan.status === 'active') {
				stopPolling();
				genState = 'idle';
				await invalidateAll();
				addToast('Your plan is ready!', 'success');
			}
		} catch {
			// Poll failed — keep trying
		}
	}

	async function retryGeneration() {
		genError = '';
		triggerGeneration();
	}

	// ── Plan display helpers ──────────────────────────────────
	let sortedDays = $derived(
		plan ? [...plan.days].sort((a, b) => a.day_index - b.day_index) : []
	);

	// Arc constants (matches exercise arc proportions)
	const ARC_R = 22;
	const ARC_C = Math.PI * ARC_R;

	function getDayProgress(day: FullPlanDay): { done: number; total: number; hasPR: boolean } {
		let total = 0;
		let done = 0;
		let hasPR = false;
		for (const ex of day.exercises) {
			for (const set of ex.sets) {
				total++;
				if (set.log && (set.log.status === 'completed' || set.log.status === 'skipped')) {
					done++;
				}
				// Check for PR: completed set with actual values exceeding target
				if (set.log && set.log.status === 'completed' && set.log.actual_weight && set.log.actual_reps) {
					if (set.target_weight && set.log.actual_weight > set.target_weight) hasPR = true;
					if (set.target_reps && set.log.actual_reps > set.target_reps) hasPR = true;
				}
			}
		}
		return { done, total, hasPR };
	}

	// ── Edit Mode (tap-to-select, tap-to-swap) ───────────────
	let editMode = $state(false);
	let selectedDayId = $state<string | null>(null);
	let swapping = $state(false);

	function handleDayTap(day: FullPlanDay) {
		if (!editMode) return;

		if (selectedDayId === null) {
			// First tap: select this day
			selectedDayId = day.id;
		} else if (selectedDayId === day.id) {
			// Tapped the same day: deselect
			selectedDayId = null;
		} else {
			// Second tap on a different day: perform the swap
			performSwap(selectedDayId, day.id);
		}
	}

	async function performSwap(idA: string, idB: string) {
		if (swapping) return;
		swapping = true;
		selectedDayId = null;

		const dayA = sortedDays.find((d) => d.id === idA);
		const dayB = sortedDays.find((d) => d.id === idB);

		try {
			const res = await fetch('/api/swap-days', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ day_id_a: idA, day_id_b: idB })
			});

			if (res.ok) {
				await invalidateAll();
				if (dayA && dayB) {
					addToast(`Swapped ${DAY_NAMES[dayA.day_index]} ↔ ${DAY_NAMES[dayB.day_index]}`, 'success');
				}
			} else {
				addToast('Swap failed — try again', 'error');
			}
		} catch {
			addToast('Network error — check your connection', 'error');
		} finally {
			swapping = false;
		}
	}

	function exitEditMode() {
		editMode = false;
		selectedDayId = null;
	}
</script>

<svelte:head>
	<title>Push — This Week</title>
</svelte:head>

<div class="agenda-page">
	<header class="agenda-header">
		<div class="header-bar">
			{#if editMode}
				<button class="edit-btn active" onclick={exitEditMode}>Done</button>
			{:else if plan && plan.days.length > 1}
				<button class="edit-btn" onclick={() => editMode = true}>Edit</button>
			{:else}
				<div class="header-slot"></div>
			{/if}
			{#if editMode}
				<span class="edit-mode-title">Edit Schedule</span>
			{:else}
				<SegmentedControl active="week" />
			{/if}
			{#if editMode}
				<div class="header-slot"></div>
			{:else}
				<AvatarMenu />
			{/if}
		</div>
		{#if editMode}
			<p class="edit-hint">Tap a day, then tap another to swap</p>
		{:else}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
		<h1
			class="header-title"
			onclick={() => { invalidateAll(); }}
			onkeydown={(e) => { if (e.key === 'Enter') invalidateAll(); }}
			title="Refresh"
		>This Week</h1>
		{/if}
	</header>

	{#if plan}
		<!-- ═══ Active plan ═══ -->
		<div class="day-list">
			{#each sortedDays as day}
				{@const progress = getDayProgress(day)}
				{@const isToday = day.day_index === todayIndex}
				{@const isRest = day.exercises.length === 0}
				{@const isComplete = progress.total > 0 && progress.done === progress.total}
				{@const isSelected = editMode && selectedDayId === day.id}

				{#if editMode}
					<button
						class="day-card"
						class:today={isToday}
						class:rest={isRest}
						class:complete={isComplete}
						class:selected={isSelected}
						class:swapping
						onclick={() => handleDayTap(day)}
						disabled={swapping}
					>
						<div class="day-card-content">
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
							{/if}
						</div>
						{#if !isRest && progress.done > 0}
							<div class="day-arc-wrap">
								<svg class="day-arc" viewBox="0 0 52 32" fill="none">
									<path d="M 4 28 A {ARC_R} {ARC_R} 0 0 1 48 28" stroke="var(--color-border)" stroke-width="3" stroke-linecap="round" fill="none" />
									<path d="M 4 28 A {ARC_R} {ARC_R} 0 0 1 48 28" stroke={isComplete ? 'var(--color-celebrate)' : 'var(--color-activity)'} stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={ARC_C} stroke-dashoffset={ARC_C * (1 - progress.done / progress.total)} class="arc-fill" />
								</svg>
								{#if isComplete}
									<span class="day-arc-icon">
										<Check size={14} strokeWidth={3} />
									</span>
								{/if}
								<span class="day-arc-label" class:complete={isComplete}>
									{#if isComplete}Done{:else}{progress.done}/{progress.total}{/if}
								</span>
							</div>
						{/if}
					</button>
				{:else}
					<a
						href="/workout/{day.day_index}"
						class="day-card"
						class:today={isToday}
						class:rest={isRest}
						class:complete={isComplete}
					>
						<div class="day-card-content">
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
							{/if}
						</div>
						{#if !isRest && progress.done > 0}
							<div class="day-arc-wrap">
								<svg class="day-arc" viewBox="0 0 52 32" fill="none">
									<path d="M 4 28 A {ARC_R} {ARC_R} 0 0 1 48 28" stroke="var(--color-border)" stroke-width="3" stroke-linecap="round" fill="none" />
									<path d="M 4 28 A {ARC_R} {ARC_R} 0 0 1 48 28" stroke={isComplete ? 'var(--color-celebrate)' : 'var(--color-activity)'} stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={ARC_C} stroke-dashoffset={ARC_C * (1 - progress.done / progress.total)} class="arc-fill" />
								</svg>
								{#if isComplete}
									<span class="day-arc-icon">
										<Check size={14} strokeWidth={3} />
									</span>
								{/if}
								<span class="day-arc-label" class:complete={isComplete}>
									{#if isComplete}Done{:else}{progress.done}/{progress.total}{/if}
								</span>
							</div>
						{/if}
					</a>
				{/if}
			{/each}
		</div>

	{:else if isGenerating}
		<!-- ═══ Generating state: status card + skeleton ═══ -->
		<div class="gen-status">
			<div class="gen-pulse"></div>
			<div class="gen-text">
				<p class="gen-title">Building your plan...</p>
				<p class="gen-subtitle">This usually takes about 15 seconds.</p>
			</div>
		</div>
		<PlanSkeleton {trainingDays} />

	{:else if genState === 'error'}
		<!-- ═══ Generation error ═══ -->
		<div class="gen-error">
			<p class="gen-error-msg">{genError}</p>
			<button class="gen-retry-btn" onclick={retryGeneration}>Try Again</button>
		</div>
		<PlanSkeleton {trainingDays} />

	{:else if hasPreviousPlan}
		<!-- ═══ Returning user: needs check-in before new plan ═══ -->
		<div class="empty-state">
			<div class="empty-icon">
				<ClipboardCheck size={32} />
			</div>
			<h2 class="empty-title">No plan for this week</h2>
			<p class="empty-desc">Check in on last week to generate your next plan.</p>
			<a href="/check-in" class="empty-cta">Check In</a>
		</div>

	{:else}
		<!-- ═══ Fallback empty state ═══ -->
		<div class="empty-state">
			<h2 class="empty-title">No plan for this week</h2>
			<p class="empty-desc">Complete onboarding to get your first training plan.</p>
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
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		user-select: none;
	}

	.header-title:active {
		opacity: 0.5;
	}

	/* ── Generation status card ── */
	.gen-status {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		background: var(--color-surface);
		border: 1.5px solid var(--color-activity-muted);
		border-radius: var(--radius);
		padding: var(--space-4);
		margin-bottom: var(--space-3);
	}

	.gen-pulse {
		width: 12px;
		height: 12px;
		border-radius: var(--radius-full);
		background: var(--color-activity);
		flex-shrink: 0;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.85); }
	}

	.gen-text {
		flex: 1;
	}

	.gen-title {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
		margin-bottom: 0.1rem;
	}

	.gen-subtitle {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	/* ── Generation error ── */
	.gen-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		background: var(--color-surface);
		border: 1.5px solid var(--color-danger-muted);
		border-radius: var(--radius);
		padding: var(--space-4);
		margin-bottom: var(--space-3);
	}

	.gen-error-msg {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: var(--leading-normal);
	}

	.gen-retry-btn {
		flex-shrink: 0;
		padding: var(--space-2) var(--space-4);
		background: var(--color-surface-hover);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		cursor: pointer;
		transition: background var(--duration-normal) var(--ease-out);
	}

	.gen-retry-btn:hover {
		background: var(--color-surface-active);
	}

	/* ── Edit mode ── */
	.edit-btn {
		min-width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		flex-shrink: 0;
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		transition: color var(--duration-fast);
		-webkit-tap-highlight-color: transparent;
	}

	.edit-btn:hover {
		color: var(--color-text);
	}

	.edit-btn.active {
		color: var(--color-activity);
		font-weight: var(--weight-semibold);
	}

	.edit-mode-title {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.edit-hint {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		text-align: center;
	}

	/* ── Day cards ── */
	.day-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.day-card {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		text-align: left;
		font: inherit;
		cursor: pointer;
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

	.day-card.selected {
		border-color: var(--color-activity);
		box-shadow: var(--shadow-glow);
	}

	.day-card.swapping {
		opacity: 0.5;
		pointer-events: none;
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
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	.dot-sep {
		opacity: 0.5;
	}

	/* Mini progress bar */
	.day-card-content {
		flex: 1;
		min-width: 0;
	}

	.day-arc-wrap {
		position: relative;
		width: 48px;
		height: 44px;
		flex-shrink: 0;
	}

	.day-arc {
		width: 100%;
		height: 28px;
		display: block;
	}

	.arc-fill {
		transition: stroke-dashoffset var(--duration-slow) var(--ease-out);
	}

	.day-arc-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		top: 14px;
		left: 50%;
		transform: translateX(-50%);
		color: var(--color-activity);
	}

	.day-arc-label {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		font-weight: var(--weight-bold);
		white-space: nowrap;
	}

	.day-arc-label.complete {
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
	}


	/* ── Empty state ── */
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
