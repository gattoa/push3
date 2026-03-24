<script lang="ts">
	import {
		Check, X, Menu, CircleUser, Trophy, ClipboardCheck,
		ChevronRight, ChevronDown, TrendingUp, Flame, Dumbbell
	} from 'lucide-svelte';

	// ── Mock Data ──────────────────────────────────────────────
	const dayIndex = 0;
	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const todayDate = 'Mar 24';
	const splitLabel = 'Push';
	const unitPref = 'lb';

	const exercises = [
		{
			id: 'ex1',
			exercise_id: '0001',
			exercise_name: 'barbell bench press',
			order_index: 0,
			notes: null,
			lastWeight: 135,
			lastReps: 8,
			bestE1RM: 171,
			sets: [
				{ id: 's1', set_number: 1, target_reps: 10, target_weight: 140, status: 'completed' as const, actualWeight: 145, actualReps: 10, isPR: true },
				{ id: 's2', set_number: 2, target_reps: 10, target_weight: 140, status: 'completed' as const, actualWeight: 140, actualReps: 9, isPR: false },
				{ id: 's3', set_number: 3, target_reps: 10, target_weight: 140, status: 'completed' as const, actualWeight: 140, actualReps: 10, isPR: false }
			]
		},
		{
			id: 'ex2',
			exercise_id: '0002',
			exercise_name: 'incline dumbbell press',
			order_index: 1,
			notes: 'Slow eccentric, 3 sec down',
			lastWeight: 50,
			lastReps: 10,
			bestE1RM: 66.7,
			sets: [
				{ id: 's4', set_number: 1, target_reps: 12, target_weight: 50, status: 'completed' as const, actualWeight: 50, actualReps: 12, isPR: false },
				{ id: 's5', set_number: 2, target_reps: 12, target_weight: 50, status: 'completed' as const, actualWeight: 50, actualReps: 10, isPR: false },
				{ id: 's6', set_number: 3, target_reps: 12, target_weight: 50, status: 'pending' as const, actualWeight: null, actualReps: null, isPR: false }
			]
		},
		{
			id: 'ex3',
			exercise_id: '0003',
			exercise_name: 'cable fly',
			order_index: 2,
			notes: null,
			lastWeight: null,
			lastReps: null,
			bestE1RM: null,
			sets: [
				{ id: 's7', set_number: 1, target_reps: 15, target_weight: null, status: 'pending' as const, actualWeight: null, actualReps: null, isPR: false },
				{ id: 's8', set_number: 2, target_reps: 15, target_weight: null, status: 'pending' as const, actualWeight: null, actualReps: null, isPR: false },
				{ id: 's9', set_number: 3, target_reps: 15, target_weight: null, status: 'skipped' as const, actualWeight: null, actualReps: null, isPR: false }
			]
		}
	];

	// ── Derived Stats ──────────────────────────────────────────
	const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
	const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.status === 'completed').length, 0);
	const skippedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.status === 'skipped').length, 0);
	const pendingSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.status === 'pending').length, 0);
	const totalVolume = exercises.reduce((sum, ex) =>
		sum + ex.sets.filter(s => s.status === 'completed' && s.actualWeight && s.actualReps)
			.reduce((v, s) => v + (s.actualWeight ?? 0) * (s.actualReps ?? 0), 0), 0);
	const prCount = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.isPR).length, 0);
	const progressPct = totalSets > 0 ? ((completedSets + skippedSets) / totalSets) * 100 : 0;
	const allDone = pendingSets === 0;

	// Per-exercise derived state
	type ExerciseState = 'completed' | 'active' | 'upcoming';

	function exerciseProgress(ex: typeof exercises[0]) {
		const total = ex.sets.length;
		const prSets = ex.sets.filter(s => s.status === 'completed' && s.isPR).length;
		const activitySets = ex.sets.filter(s => s.status === 'completed' && !s.isPR).length;
		const skippedSets = ex.sets.filter(s => s.status === 'skipped').length;
		const done = prSets + activitySets + skippedSets;
		// Cumulative percentages for stacked arc layers (bottom to top)
		const prPct = total > 0 ? (prSets / total) * 100 : 0;
		const activityPct = total > 0 ? ((prSets + activitySets) / total) * 100 : 0;
		const allPct = total > 0 ? (done / total) * 100 : 0;
		return { done, total, pct: allPct, prPct, activityPct, allPct, hasSkips: skippedSets > 0, hasPRs: prSets > 0 };
	}

	function getExerciseState(ex: typeof exercises[0], index: number): ExerciseState {
		const prog = exerciseProgress(ex);
		if (prog.done === prog.total) return 'completed';
		// Active = first exercise with pending sets
		for (let i = 0; i < exercises.length; i++) {
			if (exercises[i].sets.some(s => s.status === 'pending')) {
				return i === index ? 'active' : 'upcoming';
			}
		}
		return 'upcoming';
	}

	// Arc math for per-exercise gauge
	const EX_ARC_R = 22;
	const EX_ARC_C = Math.PI * EX_ARC_R;

	// ── Progress bar segments ──────────────────────────────────
	// Build ordered segments: one per set, in exercise order, colored by outcome
	type Segment = { color: 'activity' | 'celebrate' | 'danger' | 'pending' };
	const segments: Segment[] = exercises.flatMap(ex =>
		ex.sets.map(set => {
			if (set.status === 'completed' && set.isPR) return { color: 'celebrate' as const };
			if (set.status === 'completed') return { color: 'activity' as const };
			if (set.status === 'skipped') return { color: 'danger' as const };
			return { color: 'pending' as const };
		})
	);

	// ── Interactive State ──────────────────────────────────────
	let bannerDismissed = $state(false);
	let editingSet = $state<string | null>(null);

	// Active exercise is auto-expanded, completed are collapsed, upcoming collapsed
	function getInitialExpanded(): string | null {
		for (const ex of exercises) {
			if (ex.sets.some(s => s.status === 'pending')) return ex.id;
		}
		return null;
	}
	let expandedExercise = $state<string | null>(getInitialExpanded());
</script>

<svelte:head>
	<title>Push — Workout Preview</title>
</svelte:head>

<div class="page">
	<!-- ═══ Header ═══ -->
	<header class="header push-up" style="--d:0">
		<button class="header-icon" title="Weekly agenda">
			<Menu size={20} strokeWidth={2} />
		</button>
		<div class="header-center">
			<h1 class="header-day">{DAY_NAMES[dayIndex]}, {todayDate}</h1>
			<span class="header-split">{splitLabel}</span>
		</div>
		<button class="header-icon avatar" title="Account">
			<CircleUser size={22} strokeWidth={1.5} />
		</button>
	</header>

	<!-- ═══ Banner ═══ -->
	{#if !bannerDismissed}
		<div class="banner slide-in">
			<a href="/check-in" class="banner-link">
				<ClipboardCheck size={14} strokeWidth={2} />
				<span class="banner-text">Time for your weekly check-in</span>
				<ChevronRight size={13} strokeWidth={2} />
			</a>
			<button
				class="banner-dismiss"
				onclick={() => bannerDismissed = true}
				title="Dismiss"
			>
				<X size={12} strokeWidth={2} />
			</button>
		</div>
	{/if}

	<!-- ═══ Progress Bar (segmented) ═══ -->
	{#if !allDone}
		<div class="progress push-up" style="--d:1">
			<div class="progress-track">
				{#each segments as seg, i}
					<div
						class="progress-seg"
						class:seg-activity={seg.color === 'activity'}
						class:seg-celebrate={seg.color === 'celebrate'}
						class:seg-danger={seg.color === 'danger'}
						class:seg-pending={seg.color === 'pending'}
						style="--seg-i:{i}"
					></div>
				{/each}
			</div>
			<span class="progress-label">{completedSets + skippedSets}/{totalSets}</span>
		</div>
	{/if}

	<!-- ═══ Exercise Cards ═══ -->
	<div class="exercises">
		{#each exercises as exercise, i}
			{@const prog = exerciseProgress(exercise)}
			{@const exState = getExerciseState(exercise, i)}
			{@const isExpanded = expandedExercise === exercise.id}
			{@const hasPR = exercise.sets.some(s => s.isPR)}

			<div
				class="card push-up"
				class:card-completed={exState === 'completed'}
				class:card-active={exState === 'active'}
				class:card-upcoming={exState === 'upcoming'}
				style="--d:{i + 2}"
			>
				<!-- Exercise Header (always visible, tappable) -->
				<button class="card-header" onclick={() => expandedExercise = isExpanded ? null : exercise.id}>
					<span class="card-num" class:card-num-done={exState === 'completed' && !hasPR} class:card-num-pr={exState === 'completed' && hasPR}>
						{#if exState === 'completed'}
							<Check size={13} strokeWidth={3} />
						{:else}
							{i + 1}
						{/if}
					</span>
					<div class="card-info">
						<h3 class="card-name">{exercise.exercise_name}</h3>
						{#if exState === 'completed' && hasPR}
							<span class="card-pr-label">
								<Trophy size={11} strokeWidth={2} />
								New PR
							</span>
						{:else if exercise.lastWeight != null && exercise.lastReps != null}
							<span class="card-history">
								<TrendingUp size={11} strokeWidth={2} />
								Last: {exercise.lastWeight} {unitPref} × {exercise.lastReps}
							</span>
						{:else if exercise.bestE1RM == null}
							<span class="card-history card-new">
								<Dumbbell size={11} strokeWidth={2} />
								First time
							</span>
						{/if}
					</div>

					<!-- Per-exercise arc gauge (stacked: danger → activity → celebrate) -->
					<div class="card-arc-wrap">
						<svg class="card-arc" viewBox="0 0 52 32" fill="none">
							<!-- Track -->
							<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-border)" stroke-width="3" stroke-linecap="round" fill="none" />
							<!-- Bottom layer: all resolved (danger shows through for skips) -->
							{#if prog.allPct > 0 && prog.hasSkips}
								<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-danger)" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={EX_ARC_C} stroke-dashoffset={EX_ARC_C * (1 - prog.allPct / 100)} class="arc-fill" />
							{/if}
							<!-- Middle layer: completed (mint covers over danger) -->
							{#if prog.activityPct > 0}
								<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-activity)" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={EX_ARC_C} stroke-dashoffset={EX_ARC_C * (1 - prog.activityPct / 100)} class="arc-fill" />
							{/if}
							<!-- Top layer: PRs (gold) -->
							{#if prog.prPct > 0}
								<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-celebrate)" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={EX_ARC_C} stroke-dashoffset={EX_ARC_C * (1 - prog.prPct / 100)} class="arc-fill" />
							{/if}
							<!-- No skips, no PRs: just activity -->
							{#if prog.allPct > 0 && !prog.hasSkips && prog.prPct === 0}
								<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-activity)" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={EX_ARC_C} stroke-dashoffset={EX_ARC_C * (1 - prog.allPct / 100)} class="arc-fill" />
							{/if}
						</svg>
						<span class="card-arc-label">{prog.done}/{prog.total}</span>
					</div>

					<span class="card-chevron" class:card-chevron-open={isExpanded}>
						<ChevronDown size={16} strokeWidth={2} />
					</span>
				</button>

				{#if exercise.notes && isExpanded}
					<p class="card-notes">{exercise.notes}</p>
				{/if}

				<!-- Set Rows (collapsible) -->
				{#if isExpanded}
					<div class="sets">
						{#each exercise.sets as set}
							{@const isEditing = editingSet === set.id}
							<div
								class="set-row"
								class:completed={set.status === 'completed'}
								class:skipped={set.status === 'skipped'}
							>
								<div class="set-num">
									<span>{set.set_number}</span>
								</div>

								{#if isEditing}
									<div class="set-edit">
										<input type="number" class="set-input" value={set.target_weight ?? ''} placeholder="wt" />
										<span class="set-unit-inline">{unitPref}</span>
										<span class="set-edit-x">×</span>
										<input type="number" class="set-input" value={set.target_reps} placeholder="reps" />
									</div>
								{:else if set.status === 'completed' && set.actualWeight != null}
									<div class="set-logged">
										<span class="set-logged-val">
											<span class="set-weight">{set.actualWeight}</span>
											<span class="set-unit">{unitPref}</span>
											<span class="set-x">×</span>
											<span class="set-reps">{set.actualReps}</span>
										</span>
										{#if set.isPR}
											<span class="pr-badge">
												<Trophy size={10} strokeWidth={2.5} />
												PR
											</span>
										{/if}
									</div>
								{:else if set.status === 'skipped'}
									<div class="set-logged">
										<span class="set-logged-val set-struck">
											{#if set.target_weight != null}
												<span class="set-weight">{set.target_weight}</span>
												<span class="set-unit">{unitPref}</span>
												<span class="set-x">×</span>
												<span class="set-reps">{set.target_reps}</span>
											{:else}
												<span class="set-reps">{set.target_reps} reps</span>
											{/if}
										</span>
										<span class="skip-marker">Skipped</span>
									</div>
								{:else}
									<button class="set-target" onclick={() => editingSet = set.id}>
										{#if set.target_weight != null}
											<span class="set-weight">{set.target_weight}</span>
											<span class="set-unit">{unitPref}</span>
											<span class="set-x">×</span>
											<span class="set-reps">{set.target_reps}</span>
										{:else}
											<span class="set-reps">{set.target_reps} reps</span>
										{/if}
									</button>
								{/if}

								<!-- Actions: always two slots to prevent layout shift -->
								<div class="set-actions">
									{#if set.status === 'completed'}
										<button class="set-btn set-btn-skip-idle set-btn-disabled" disabled>
											<X size={13} strokeWidth={2} />
										</button>
										<button class="set-btn set-btn-done" title="Undo">
											<Check size={16} strokeWidth={3} />
										</button>
									{:else if set.status === 'skipped'}
										<button class="set-btn set-btn-skip-idle set-btn-skip-on" title="Undo skip">
											<X size={13} strokeWidth={2} />
										</button>
										<button class="set-btn set-btn-confirm set-btn-disabled" disabled>
											<Check size={16} strokeWidth={2.5} />
										</button>
									{:else}
										<button class="set-btn set-btn-skip-idle" title="Skip set">
											<X size={13} strokeWidth={2} />
										</button>
										<button class="set-btn set-btn-confirm" title="Done — log as prescribed">
											<Check size={16} strokeWidth={2.5} />
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- ═══ Completion Summary (replaces progress bar when all done) ═══ -->
	{#if allDone}
		<div class="summary push-up" style="--d:5">
			<div class="summary-header">
				<div class="summary-progress-ring">
					<svg viewBox="0 0 48 48" fill="none">
						<circle cx="24" cy="24" r="20" stroke="var(--color-border)" stroke-width="3" fill="none" />
						<circle cx="24" cy="24" r="20" stroke="var(--color-celebrate)" stroke-width="3" fill="none"
							stroke-dasharray={Math.PI * 40}
							stroke-dashoffset="0"
							stroke-linecap="round"
							transform="rotate(-90 24 24)"
						/>
					</svg>
					<Check size={20} strokeWidth={3} class="summary-check" />
				</div>
				<h3 class="summary-title">Workout Complete</h3>
			</div>
			<div class="summary-stats">
				<div class="summary-stat summary-done">
					<span class="summary-val">{completedSets}</span>
					<span class="summary-label">Done</span>
				</div>
				<div class="summary-stat summary-skipped">
					<span class="summary-val">{skippedSets}</span>
					<span class="summary-label">Skipped</span>
				</div>
				<div class="summary-stat">
					<span class="summary-val summary-volume">
						<Flame size={18} strokeWidth={2} />
						{totalVolume.toLocaleString()}
					</span>
					<span class="summary-label">Volume</span>
				</div>
				{#if prCount > 0}
					<div class="summary-stat summary-pr">
						<span class="summary-val">
							<Trophy size={18} strokeWidth={2} />
							{prCount}
						</span>
						<span class="summary-label">PRs</span>
					</div>
				{/if}
			</div>
			</div>
	{/if}
</div>

<style>
	/* ═══ Animations ═══ */
	@keyframes pushUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes slideIn {
		from { opacity: 0; transform: translateY(-12px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes arcDraw {
		from { stroke-dashoffset: 69; }
	}

	.push-up {
		animation: pushUp 0.6s var(--ease-out) both;
		animation-delay: calc(var(--d, 0) * 80ms + 100ms);
	}

	.slide-in {
		animation: slideIn 0.4s var(--ease-out) both;
		animation-delay: 200ms;
	}

	.arc-fill {
		animation: arcDraw 0.8s var(--ease-out) both;
		animation-delay: 400ms;
	}

	/* ═══ Page ═══ */
	.page {
		min-height: 100vh;
		min-height: 100dvh;
		padding: var(--page-pad-top) var(--page-gutter) var(--page-pad-bottom);
		max-width: var(--page-max-width);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	/* ═══ Header ═══ */
	.header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.header-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		flex-shrink: 0;
	}

	.header-icon:hover {
		border-color: var(--color-border-strong);
		color: var(--color-text);
	}

	.header-icon.avatar {
		border-radius: var(--radius-full);
	}

	.header-center {
		flex: 1;
		min-width: 0;
		text-align: center;
	}

	.header-day {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
	}

	.header-split {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}

	/* ═══ Banner (bold notification — distinct from cards, glow-from-within) ═══ */
	.banner {
		display: flex;
		align-items: center;
		background: var(--color-reflect-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		box-shadow: 0 2px 10px rgba(167, 139, 250, 0.08);
		transition: all var(--duration-normal) var(--ease-out);
	}

	.banner:hover {
		background: rgba(167, 139, 250, 0.18);
		box-shadow: 0 2px 14px rgba(167, 139, 250, 0.14);
	}

	.banner-link {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2-5, var(--space-3)) var(--space-3);
		text-decoration: none;
		color: var(--color-reflect);
	}

	.banner-text {
		flex: 1;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.banner-link > :global(svg:last-of-type) {
		color: var(--color-reflect);
		flex-shrink: 0;
	}

	.banner-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 var(--space-3);
		background: none;
		border: none;
		color: var(--color-text-tertiary);
		cursor: pointer;
		transition: color var(--duration-fast);
	}

	.banner-dismiss:hover {
		color: var(--color-text-secondary);
	}

	/* ═══ Progress Bar (segmented) ═══ */
	.progress {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.progress-track {
		flex: 1;
		height: 4px;
		display: flex;
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-seg {
		flex: 1;
		height: 100%;
		transition: background var(--duration-slow) var(--ease-out);
	}

	.seg-activity {
		background: linear-gradient(90deg, var(--color-activity-strong), var(--color-activity));
	}

	.seg-celebrate {
		background: linear-gradient(90deg, var(--color-celebrate-strong), var(--color-celebrate));
	}

	.seg-danger {
		background: linear-gradient(90deg, var(--color-danger-strong), var(--color-danger));
	}

	.seg-pending {
		background: var(--color-border);
	}

	.progress-label {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		min-width: 2.5rem;
		text-align: right;
	}

	/* ═══ Exercise Cards ═══ */
	.exercises {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
		transition: all var(--duration-normal) var(--ease-out);
	}

	/* State: Completed — muted, settled */
	.card-completed {
		opacity: var(--opacity-muted);
		box-shadow: none;
	}

	.card-completed:hover {
		opacity: var(--opacity-hover);
	}

	/* State: Active — prominent, glow */
	.card-active {
		box-shadow: var(--shadow-sm), 0 2px 12px rgba(45, 212, 168, 0.08);
	}

	/* State: Upcoming — default, no glow */
	.card-upcoming {
		box-shadow: var(--shadow-sm);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: none;
		border: none;
		color: var(--color-text);
		width: 100%;
		text-align: left;
		cursor: pointer;
		transition: background var(--duration-fast);
	}

	.card-header:hover {
		background: var(--color-surface-hover);
	}

	.card-num {
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: var(--weight-bold);
		color: var(--color-activity);
		background: var(--color-activity-muted);
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.card-num-done {
		color: var(--color-text-tertiary);
		background: var(--color-border);
	}

	.card-num-pr {
		color: var(--color-celebrate);
		background: var(--color-celebrate-muted);
	}

	.card-info {
		flex: 1;
		min-width: 0;
	}

	.card-name {
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		text-transform: capitalize;
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
	}

	.card-history {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		margin-top: var(--space-0-5);
	}

	.card-new {
		color: var(--color-activity);
		font-family: var(--font-body);
		font-style: italic;
	}

	.card-pr-label {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: var(--weight-bold);
		color: var(--color-celebrate);
		margin-top: var(--space-0-5);
	}

	.card-notes {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		font-style: italic;
		padding: 0 var(--space-4) var(--space-3);
		margin-top: calc(-1 * var(--space-2));
	}

	/* Per-exercise arc gauge */
	.card-arc-wrap {
		position: relative;
		width: 48px;
		height: 28px;
		flex-shrink: 0;
	}

	.card-arc {
		width: 100%;
		height: 100%;
	}

	.card-arc-label {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		font-family: var(--font-mono);
		font-size: var(--text-2xs);
		color: var(--color-text-tertiary);
		font-weight: var(--weight-bold);
	}

	/* Chevron toggle */
	.card-chevron {
		color: var(--color-text-tertiary);
		transition: transform var(--duration-normal) var(--ease-out);
		flex-shrink: 0;
	}

	.card-chevron-open {
		transform: rotate(180deg);
	}

	/* ═══ Set Rows ═══ */
	.sets {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: var(--color-border-subtle);
	}

	.set-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--color-bg-raised);
		transition: background var(--duration-normal) var(--ease-out);
	}

	.set-row.completed {
		background: var(--color-activity-subtle);
	}

	.set-row.skipped {
		background: var(--color-bg-raised);
	}

	.set-num {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
	}

	.set-num > span {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		font-weight: var(--weight-bold);
	}

	/* ═══ PR Badge ═══ */
	.pr-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-0-5);
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		font-weight: var(--weight-extrabold);
		color: var(--color-celebrate);
		background: var(--color-celebrate-muted);
		padding: 1px var(--space-1-5);
		border-radius: var(--radius-full);
		letter-spacing: var(--tracking-wide);
		line-height: 1;
		text-transform: uppercase;
	}

	/* ═══ Set Logged ═══ */
	.set-logged {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.set-logged-val {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
		display: inline-flex;
		align-items: baseline;
	}

	/* Strikethrough for skipped sets */
	.set-struck {
		text-decoration: line-through;
		text-decoration-color: var(--color-text-tertiary);
		color: var(--color-text-tertiary);
	}

	.skip-marker {
		display: inline-flex;
		align-items: center;
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		font-weight: var(--weight-extrabold);
		color: var(--color-danger);
		background: var(--color-danger-muted);
		padding: 1px var(--space-1-5);
		border-radius: var(--radius-full);
		letter-spacing: var(--tracking-wide);
		line-height: 1;
		text-transform: uppercase;
	}

	/* ═══ Set Target (tappable) ═══ */
	.set-target {
		flex: 1;
		background: none;
		border: none;
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-align: left;
		cursor: pointer;
		padding: var(--space-1) 0;
		border-radius: var(--radius-xs);
		transition: color var(--duration-fast);
		display: inline-flex;
		align-items: baseline;
	}

	.set-target:hover {
		color: var(--color-activity);
	}

	.set-weight {
		font-weight: var(--weight-semibold);
	}

	.set-unit {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		font-weight: var(--weight-regular);
		margin-left: var(--space-0-5);
	}

	.set-x {
		color: var(--color-text-tertiary);
		margin: 0 var(--space-2);
	}

	.set-reps {
		font-weight: var(--weight-medium);
	}

	/* ═══ Set Edit Mode ═══ */
	.set-edit {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.set-input {
		width: 56px;
		padding: var(--space-1-5) var(--space-2);
		background: var(--color-bg);
		border: 1.5px solid var(--color-activity);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		text-align: center;
		outline: none;
		-moz-appearance: textfield;
	}

	.set-input::-webkit-outer-spin-button,
	.set-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
	}

	.set-unit-inline {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		margin-left: calc(-1 * var(--space-1));
	}

	.set-edit-x {
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
	}

	/* ═══ Set Action Buttons (fixed 2-slot layout) ═══ */
	.set-actions {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
	}

	/* Invisible placeholder to maintain layout when one button is hidden */
	.set-btn-placeholder {
		width: 26px;
		height: 26px;
	}

	.set-btn {
		border-radius: var(--radius-md);
		border: 1.5px solid var(--color-border);
		background: transparent;
		color: var(--color-text-tertiary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--duration-normal) var(--ease-out);
	}

	.set-btn-confirm {
		width: 34px;
		height: 34px;
	}

	.set-btn-confirm:hover {
		border-color: var(--color-activity);
		color: var(--color-activity);
		background: var(--color-activity-subtle);
	}

	.set-btn-skip-idle {
		width: 26px;
		height: 26px;
		border-color: transparent;
		color: var(--color-text-tertiary);
		opacity: var(--opacity-muted);
	}

	.set-btn-skip-idle:hover {
		color: var(--color-danger);
		opacity: 1;
	}

	/* Skip activated — just turns red, no background/border change */
	.set-btn-skip-on {
		color: var(--color-danger);
		opacity: 1;
	}

	/* Disabled button — stays in layout but non-interactive */
	.set-btn-disabled {
		opacity: 0.3;
		pointer-events: none;
	}

	.set-btn-done {
		width: 34px;
		height: 34px;
		border-color: var(--color-activity);
		color: var(--color-activity);
		background: var(--color-activity-muted);
	}

	/* ═══ Completion Summary ═══ */
	.summary {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-6);
		text-align: center;
		box-shadow: 0 4px 16px rgba(232, 185, 49, 0.06);
	}

	.summary-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}

	.summary-progress-ring {
		position: relative;
		width: 48px;
		height: 48px;
	}

	.summary-progress-ring svg {
		width: 100%;
		height: 100%;
	}

	:global(.summary-check) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: var(--color-celebrate);
	}

	.summary-title {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		color: var(--color-celebrate);
		letter-spacing: var(--tracking-tight);
	}

	.summary-stats {
		display: flex;
		justify-content: center;
		gap: var(--space-8);
		margin-bottom: var(--space-6);
	}

	.summary-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-0-5);
	}

	.summary-val {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: var(--weight-extrabold);
		line-height: 1;
		min-height: 1.8rem;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.summary-volume {
		font-size: var(--text-xl);
	}

	.summary-label {
		font-size: var(--text-2xs);
		color: var(--color-text-tertiary);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		font-weight: var(--weight-semibold);
	}

	.summary-done .summary-val {
		color: var(--color-activity);
	}

	.summary-skipped .summary-val {
		color: var(--color-danger);
	}

	.summary-pr .summary-val {
		color: var(--color-celebrate);
	}

	.summary-pr .summary-label {
		color: var(--color-celebrate);
	}

</style>
