<script lang="ts">
	import {
		Check, X, Menu, Trophy, ClipboardCheck,
		ChevronRight, ChevronDown, TrendingUp, Flame, Dumbbell, Eye, CircleUser
	} from 'lucide-svelte';

	// ── Mock Data (replaces server props) ─────────────────────
	const dayIndex = 0;
	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	const unitPref = 'lb';

	const exerciseHistory: Record<string, { lastWeight: number; lastReps: number; bestE1RM: number }> = {
		'0001': { lastWeight: 135, lastReps: 8, bestE1RM: 171 },
		'0002': { lastWeight: 50, lastReps: 10, bestE1RM: 66.7 }
	};

	const initialBanner: 'check-in' | 'plan-review' | null = 'check-in';

	// Mock day structure matching FullPlanDay
	const day = {
		id: 'd1',
		day_index: 0,
		split_label: 'Push',
		exercises: [
			{
				id: 'ex1', exercise_id: '0001', exercise_name: 'barbell bench press',
				order_index: 0, notes: null,
				sets: [
					{ id: 's1', set_number: 1, target_reps: 10, target_weight: 140, log: { id: 'l1', actual_weight: 145, actual_reps: 10, status: 'completed', logged_at: '2026-03-24T10:00:00Z' } },
					{ id: 's2', set_number: 2, target_reps: 10, target_weight: 140, log: { id: 'l2', actual_weight: 140, actual_reps: 9, status: 'completed', logged_at: '2026-03-24T10:05:00Z' } },
					{ id: 's3', set_number: 3, target_reps: 10, target_weight: 140, log: { id: 'l3', actual_weight: 140, actual_reps: 10, status: 'completed', logged_at: '2026-03-24T10:10:00Z' } }
				]
			},
			{
				id: 'ex2', exercise_id: '0002', exercise_name: 'incline dumbbell press',
				order_index: 1, notes: 'Slow eccentric, 3 sec down',
				sets: [
					{ id: 's4', set_number: 1, target_reps: 12, target_weight: 50, log: { id: 'l4', actual_weight: 50, actual_reps: 12, status: 'completed', logged_at: '2026-03-24T10:15:00Z' } },
					{ id: 's5', set_number: 2, target_reps: 12, target_weight: 50, log: { id: 'l5', actual_weight: 50, actual_reps: 10, status: 'completed', logged_at: '2026-03-24T10:20:00Z' } },
					{ id: 's6', set_number: 3, target_reps: 12, target_weight: 50, log: null }
				]
			},
			{
				id: 'ex3', exercise_id: '0003', exercise_name: 'cable fly',
				order_index: 2, notes: null,
				sets: [
					{ id: 's7', set_number: 1, target_reps: 15, target_weight: null, log: null },
					{ id: 's8', set_number: 2, target_reps: 15, target_weight: null, log: null },
					{ id: 's9', set_number: 3, target_reps: 15, target_weight: null, log: { id: 'l6', actual_weight: null, actual_reps: null, status: 'skipped', logged_at: '2026-03-24T10:30:00Z' } }
				]
			}
		]
	};

	// Mock user (no auth)
	let showMenu = $state(false);
	const avatarUrl: string | null = null;
	const initials = 'AG';
	const user = { user_metadata: { full_name: 'Andrew Gatto' }, email: 'ag@example.com' };
	function signOut() { showMenu = false; }

	// ── Set State ──────────────────────────────────────────────
	let setStates = $state<Record<string, {
		weight: string;
		reps: string;
		status: 'pending' | 'completed' | 'skipped';
		saving: boolean;
		logId: string | null;
	}>>({});

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

	// ── Derived Stats ──────────────────────────────────────────
	let totalSets = $derived(day.exercises.reduce((sum: number, ex: any) => sum + ex.sets.length, 0));
	let completedSets = $derived(Object.values(setStates).filter((s) => s.status === 'completed').length);
	let skippedSets = $derived(Object.values(setStates).filter((s) => s.status === 'skipped').length);
	let totalVolume = $derived(
		Object.values(setStates).reduce((sum: number, s) => {
			if (s.status === 'completed' && s.weight && s.reps) {
				return sum + parseFloat(s.weight) * parseInt(s.reps, 10);
			}
			return sum;
		}, 0)
	);
	let allDone = $derived(completedSets + skippedSets === totalSets && totalSets > 0);

	// ── PR Detection ──────────────────────────────────────────
	function computeE1RM(weight: number, reps: number): number {
		return weight * (1 + reps / 30);
	}

	function isPR(exerciseId: string, setId: string): boolean {
		const s = setStates[setId];
		if (!s || s.status !== 'completed' || !s.weight || !s.reps) return false;
		const w = parseFloat(s.weight);
		const r = parseInt(s.reps, 10);
		const current = computeE1RM(w, r);
		if (current === null || current <= 0) return false;

		const hist = exerciseHistory[exerciseId];
		const baseline = hist?.bestE1RM ?? 0;
		if (current <= baseline) return false;

		const exercise = day.exercises.find((ex: any) => ex.exercise_id === exerciseId);
		if (!exercise) return false;

		const thisSet = exercise.sets.find((st: any) => st.id === setId);
		for (const set of exercise.sets) {
			if (set.id === setId) continue;
			const other = setStates[set.id];
			if (!other || other.status !== 'completed' || !other.weight || !other.reps) continue;
			const otherE1RM = computeE1RM(parseFloat(other.weight), parseInt(other.reps, 10));
			if (otherE1RM === null) continue;
			if (otherE1RM > current) return false;
			if (otherE1RM === current && thisSet && set.set_number > thisSet.set_number) return false;
		}

		return true;
	}

	let prCount = $derived(
		day.exercises.reduce((sum: number, ex: any) =>
			sum + ex.sets.filter((set: any) => isPR(ex.exercise_id, set.id)).length, 0)
	);

	// ── Per-Exercise Progress ─────────────────────────────────
	const EX_ARC_R = 22;
	const EX_ARC_C = Math.PI * EX_ARC_R;

	function exerciseProgress(exercise: any) {
		const total = exercise.sets.length;
		let prSets = 0, actSets = 0, skipSets = 0;
		for (const set of exercise.sets) {
			const s = setStates[set.id];
			if (!s) continue;
			if (s.status === 'completed' && isPR(exercise.exercise_id, set.id)) prSets++;
			else if (s.status === 'completed') actSets++;
			else if (s.status === 'skipped') skipSets++;
		}
		const done = prSets + actSets + skipSets;
		return {
			done, total,
			prPct: total > 0 ? (prSets / total) * 100 : 0,
			activityPct: total > 0 ? ((prSets + actSets) / total) * 100 : 0,
			allPct: total > 0 ? (done / total) * 100 : 0,
			hasSkips: skipSets > 0,
			hasPRs: prSets > 0
		};
	}

	type ExerciseState = 'completed' | 'active' | 'upcoming';
	function getExerciseState(exercise: any, index: number): ExerciseState {
		const prog = exerciseProgress(exercise);
		if (prog.done === prog.total) return 'completed';
		const sorted = day.exercises.slice().sort((a: any, b: any) => a.order_index - b.order_index);
		for (let i = 0; i < sorted.length; i++) {
			if (sorted[i].sets.some((set: any) => setStates[set.id]?.status === 'pending')) {
				return sorted[i].id === exercise.id ? 'active' : 'upcoming';
			}
		}
		return 'upcoming';
	}

	// ── Progress Bar Segments ─────────────────────────────────
	type Segment = { color: 'activity' | 'celebrate' | 'danger' | 'pending' };
	let segments = $derived<Segment[]>(
		day.exercises
			.slice()
			.sort((a: any, b: any) => a.order_index - b.order_index)
			.flatMap((ex: any) =>
				ex.sets
					.slice()
					.sort((a: any, b: any) => a.set_number - b.set_number)
					.map((set: any) => {
						const s = setStates[set.id];
						if (!s) return { color: 'pending' as const };
						if (s.status === 'completed' && isPR(ex.exercise_id, set.id)) return { color: 'celebrate' as const };
						if (s.status === 'completed') return { color: 'activity' as const };
						if (s.status === 'skipped') return { color: 'danger' as const };
						return { color: 'pending' as const };
					})
			)
	);

	// ── Accordion ─────────────────────────────────────────────
	function getInitialExpanded(): string | null {
		const sorted = day.exercises.slice().sort((a: any, b: any) => a.order_index - b.order_index);
		for (const ex of sorted) {
			if (ex.sets.some((set: any) => set.log?.status !== 'completed' && set.log?.status !== 'skipped')) return ex.id;
		}
		return sorted[0]?.id ?? null;
	}
	let expandedExercise = $state<string | null>(getInitialExpanded());

	// ── Banner ────────────────────────────────────────────────
	let bannerDismissed = $state(false);

	// ── Mock API (local state toggle, no fetch) ───────────────
	function handleComplete(setId: string) {
		const s = setStates[setId];
		if (!s) return;
		const newStatus = s.status === 'completed' ? 'pending' : 'completed';
		// Auto-fill with target values if no weight/reps entered
		const exercise = day.exercises.find((ex: any) => ex.sets.some((set: any) => set.id === setId));
		const set = exercise?.sets.find((set: any) => set.id === setId);
		const weight = s.weight || (set?.target_weight != null ? String(set.target_weight) : '');
		const reps = s.reps || (set?.target_reps != null ? String(set.target_reps) : '');
		setStates[setId] = { ...s, status: newStatus, weight, reps };
	}

	function handleSkip(setId: string) {
		const s = setStates[setId];
		if (!s) return;
		setStates[setId] = { ...s, status: s.status === 'skipped' ? 'pending' : 'skipped' };
	}
</script>
<svelte:head>
	<title>Push — Workout Preview</title>
</svelte:head>

<div class="page">
	<!-- ═══ Header ═══ -->
	<header class="header push-up" style="--d:0">
		<a href="/" class="header-icon" title="Weekly agenda">
			<Menu size={20} strokeWidth={2} />
		</a>
		<div class="header-center">
			<h1 class="header-day">{DAY_NAMES[dayIndex]}, {todayDate}</h1>
			<span class="header-split">{day.split_label}</span>
		</div>
		<div class="avatar-wrapper">
			<button class="header-icon avatar" onclick={() => showMenu = !showMenu} title="Account">
				{#if avatarUrl}
					<img src={avatarUrl} alt="Avatar" class="avatar-img" referrerpolicy="no-referrer" />
				{:else}
					<span class="avatar-initials">{initials}</span>
				{/if}
			</button>
			{#if showMenu}
				<div class="avatar-menu">
					<div class="menu-user">{user?.user_metadata?.full_name ?? user?.email ?? ''}</div>
					<button class="menu-item" onclick={signOut}>Sign Out</button>
				</div>
			{/if}
		</div>
	</header>

	<!-- ═══ Banner ═══ -->
	{#if initialBanner && !bannerDismissed}
		<div class="banner slide-in">
			{#if initialBanner === 'check-in'}
				<a href="/" class="banner-link">
					<ClipboardCheck size={14} strokeWidth={2} />
					<span class="banner-text">Time for your weekly check-in</span>
					<ChevronRight size={13} strokeWidth={2} />
				</a>
			{:else}
				<a href="/" class="banner-link banner-link-plan">
					<Eye size={14} strokeWidth={2} />
					<span class="banner-text">Review your new training plan</span>
					<ChevronRight size={13} strokeWidth={2} />
				</a>
			{/if}
			<button
				class="banner-dismiss"
				onclick={() => bannerDismissed = true}
				title="Dismiss"
			>
				<X size={12} strokeWidth={2} />
			</button>
		</div>
	{/if}

	{#if day.exercises.length === 0}
		<div class="rest-state push-up" style="--d:1">
			<p>Rest day. Recover and prepare for your next session.</p>
			<a href="/" class="btn btn-secondary">View Weekly Plan</a>
		</div>
	{:else}
		<!-- ═══ Progress Bar / Completion Summary ═══ -->
		{#if allDone}
			<div class="summary push-up" style="--d:1">
				<div class="summary-header">
					<div class="summary-ring">
						<svg viewBox="0 0 28 28" fill="none">
							<circle cx="14" cy="14" r="11" stroke="var(--color-celebrate)" stroke-width="2.5" fill="none" />
						</svg>
						<Check size={12} strokeWidth={3} class="summary-check" />
					</div>
					<h3 class="summary-title">Workout Complete</h3>
				</div>

				<div class="progress">
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
				</div>

				<div class="summary-stats">
					<span class="summary-stat summary-done">{completedSets} Done</span>
					{#if skippedSets > 0}
						<span class="summary-dot">&middot;</span>
						<span class="summary-stat summary-skipped">{skippedSets} Skipped</span>
					{/if}
					{#if prCount > 0}
						<span class="summary-dot">&middot;</span>
						<span class="summary-stat summary-pr"><Trophy size={13} strokeWidth={2.5} /> {prCount} {prCount === 1 ? 'PR' : 'PRs'}</span>
					{/if}
					<span class="summary-dot">&middot;</span>
					<span class="summary-stat summary-volume"><Flame size={13} strokeWidth={2} /> {totalVolume.toLocaleString()}</span>
				</div>
			</div>
		{:else}
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
			{#each day.exercises.slice().sort((a, b) => a.order_index - b.order_index) as exercise, i}
				{@const prog = exerciseProgress(exercise)}
				{@const exState = getExerciseState(exercise, i)}
				{@const isExpanded = expandedExercise === exercise.id}
				{@const hasPR = exercise.sets.some((s) => isPR(exercise.exercise_id, s.id))}
				{@const hist = exerciseHistory[exercise.exercise_id]}

				<div
					class="card push-up"
					class:card-completed={exState === 'completed'}
					class:card-active={exState === 'active'}
					class:card-upcoming={exState === 'upcoming'}
					style="--d:{i + 2}"
				>
					<!-- Exercise Header (tappable accordion) -->
					<button class="card-header" onclick={() => expandedExercise = isExpanded ? null : exercise.id}>
						<span class="card-num" class:card-num-done={exState === 'completed' && !hasPR} class:card-num-pr={exState === 'completed' && hasPR} class:card-num-upcoming={exState === 'upcoming'}>
							{#if exState === 'completed'}
								<Check size={13} strokeWidth={3} />
							{:else}
								{i + 1}
							{/if}
						</span>
						<div class="card-info">
							{#if isExpanded}
								<a
									href="/exercise/{exercise.exercise_id.replace(/\s+/g, '-')}?name={encodeURIComponent(exercise.exercise_name)}"
									class="card-name-link"
									onclick={(e) => e.stopPropagation()}
								>
									<h3 class="card-name">{exercise.exercise_name}</h3>
								</a>
							{:else}
								<h3 class="card-name">{exercise.exercise_name}</h3>
							{/if}
							{#if exState === 'completed' && hasPR}
								<span class="card-pr-label">
									<Trophy size={11} strokeWidth={2} />
									New PR
								</span>
							{:else if hist}
								<span class="card-history">
									<TrendingUp size={11} strokeWidth={2} />
									Last: {hist.lastWeight} {unitPref} × {hist.lastReps}
								</span>
							{:else}
								<span class="card-history card-new">
									<Dumbbell size={11} strokeWidth={2} />
									First time
								</span>
							{/if}
						</div>

						<!-- Per-exercise arc gauge -->
						<div class="card-arc-wrap">
							<svg class="card-arc" viewBox="0 0 52 32" fill="none">
								<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-border)" stroke-width="3" stroke-linecap="round" fill="none" />
								{#if prog.allPct > 0 && prog.hasSkips}
									<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-danger)" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={EX_ARC_C} stroke-dashoffset={EX_ARC_C * (1 - prog.allPct / 100)} class="arc-fill" />
								{/if}
								{#if prog.activityPct > 0}
									<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-activity)" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={EX_ARC_C} stroke-dashoffset={EX_ARC_C * (1 - prog.activityPct / 100)} class="arc-fill" />
								{/if}
								{#if prog.prPct > 0}
									<path d="M 4 28 A {EX_ARC_R} {EX_ARC_R} 0 0 1 48 28" stroke="var(--color-celebrate)" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray={EX_ARC_C} stroke-dashoffset={EX_ARC_C * (1 - prog.prPct / 100)} class="arc-fill" />
								{/if}
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
							{#each exercise.sets.slice().sort((a, b) => a.set_number - b.set_number) as set}
								{@const s = setStates[set.id]}
								{@const setIsPR = isPR(exercise.exercise_id, set.id)}
								{#if s}
									<div
										class="set-row"
										class:completed={s.status === 'completed'}
										class:skipped={s.status === 'skipped'}
									>
										<div class="set-num">
											<span>{set.set_number}</span>
										</div>

										<div class="set-edit" class:set-struck={s.status === 'skipped'}>
											<span class="set-input-wrap">
												<input
													type="number"
													inputmode="decimal"
													class="set-input"
													placeholder={set.target_weight != null ? String(set.target_weight) : '—'}
													bind:value={s.weight}
													readonly={s.status !== 'pending'}
												/>
												<span class="set-input-unit">{unitPref}</span>
											</span>
											<span class="set-edit-x">×</span>
											<span class="set-input-wrap">
												<input
													type="number"
													inputmode="numeric"
													class="set-input"
													placeholder={String(set.target_reps)}
													bind:value={s.reps}
													readonly={s.status !== 'pending'}
												/>
											</span>
											{#if s.status === 'completed' && setIsPR}
												<span class="pr-badge">
													<Trophy size={10} strokeWidth={2.5} />
													PR
												</span>
											{/if}
											{#if s.status === 'skipped'}
												<span class="skip-marker">Skipped</span>
											{/if}
										</div>

										<!-- Action buttons -->
										<div class="set-actions">
											{#if s.status === 'completed'}
												<button class="set-btn set-btn-skip-idle set-btn-disabled" disabled>
													<X size={13} strokeWidth={2} />
												</button>
												<button class="set-btn set-btn-done" onclick={() => handleComplete(set.id)} disabled={s.saving} title="Undo">
													<Check size={16} strokeWidth={3} />
												</button>
											{:else if s.status === 'skipped'}
												<button class="set-btn set-btn-skip-idle set-btn-skip-on" onclick={() => handleSkip(set.id)} disabled={s.saving} title="Undo skip">
													<X size={13} strokeWidth={2} />
												</button>
												<button class="set-btn set-btn-confirm set-btn-disabled" disabled>
													<Check size={16} strokeWidth={2.5} />
												</button>
											{:else}
												<button class="set-btn set-btn-skip-idle" onclick={() => handleSkip(set.id)} disabled={s.saving} title="Skip set">
													<X size={13} strokeWidth={2} />
												</button>
												<button class="set-btn set-btn-confirm" onclick={() => handleComplete(set.id)} disabled={s.saving} title="Done — log as prescribed">
													<Check size={16} strokeWidth={2.5} />
												</button>
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			{/each}
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
		text-decoration: none;
	}

	.header-icon:hover {
		border-color: var(--color-border-strong);
		color: var(--color-text);
	}

	.header-icon.avatar {
		border-radius: var(--radius-full);
		padding: 0;
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initials {
		font-family: var(--font-display);
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-secondary);
	}

	.avatar-wrapper {
		position: relative;
	}

	.avatar-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 180px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		z-index: 100;
		overflow: hidden;
	}

	.menu-user {
		padding: 0.75rem 1rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: 0.65rem 1rem;
		background: none;
		border: none;
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: 0.85rem;
		text-align: left;
		cursor: pointer;
		transition: background 0.1s ease;
	}

	.menu-item:hover {
		background: rgba(255, 255, 255, 0.05);
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

	/* ═══ Banner ═══ */
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
		padding: var(--space-3);
		text-decoration: none;
		color: var(--color-reflect);
	}

	.banner-link-plan {
		color: var(--color-activity);
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

	.banner-link-plan > :global(svg:last-of-type) {
		color: var(--color-activity);
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

	/* ═══ Rest State ═══ */
	.rest-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-secondary);
		font-size: var(--text-base);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
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

	.card-completed {
		opacity: var(--opacity-muted);
		box-shadow: none;
	}

	.card-completed:hover {
		opacity: var(--opacity-hover);
	}

	.card-active {
		box-shadow: var(--shadow-sm), 0 4px 16px rgba(45, 212, 168, 0.08);
	}

	.card-upcoming {
		opacity: 0.6;
		box-shadow: none;
	}

	.card-upcoming:hover {
		opacity: 0.8;
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

	.card-num-upcoming {
		color: var(--color-text-secondary);
		background: var(--color-border);
	}

	.card-info {
		flex: 1;
		min-width: 0;
	}

	.card-name-link {
		text-decoration: none;
		color: inherit;
	}

	.card-name-link:hover .card-name {
		color: var(--color-activity);
	}

	.card-name {
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		text-transform: capitalize;
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
		transition: color var(--duration-fast);
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
		background: var(--color-bg-raised);
		opacity: 0.55;
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

	/* ═══ Set States ═══ */
	.set-struck .set-input {
		text-decoration: line-through;
		text-decoration-color: var(--color-text-tertiary);
		color: var(--color-text-tertiary);
	}

	.set-struck .set-input-unit,
	.set-struck .set-edit-x {
		color: var(--color-text-tertiary);
		text-decoration: line-through;
		text-decoration-color: var(--color-text-tertiary);
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
		margin-left: var(--space-2);
	}

	/* Completed: step back — done, not the focus */
	.completed .set-input {
		color: var(--color-text-secondary);
		font-weight: var(--weight-medium);
		cursor: default;
	}

	.completed .set-input-unit,
	.completed .set-edit-x {
		color: var(--color-text-tertiary);
	}

	/* ═══ Set Edit Mode ═══ */
	.set-edit {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.set-input-wrap {
		display: inline-flex;
		align-items: baseline;
		border: 1.5px solid transparent;
		border-radius: var(--radius-sm);
		padding: var(--space-1-5) var(--space-2);
		transition: all var(--duration-fast);
	}

	.set-input-wrap:focus-within {
		border-color: var(--color-activity);
		background: var(--color-bg);
	}

	.set-input {
		width: 2.5ch;
		min-width: 1.5ch;
		background: transparent;
		border: none;
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-align: left;
		outline: none;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.set-input::placeholder {
		color: var(--color-text);
		font-weight: var(--weight-medium);
	}

	.set-input::-webkit-outer-spin-button,
	.set-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
	}

	.set-input-unit {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		font-weight: var(--weight-regular);
		margin-left: var(--space-0-5);
	}

	.set-edit-x {
		color: var(--color-text-tertiary);
		margin: 0 var(--space-2);
	}

	/* ═══ Set Action Buttons ═══ */
	.set-actions {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
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

	.set-btn-confirm:hover:not(:disabled) {
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

	.set-btn-skip-idle:hover:not(:disabled) {
		color: var(--color-danger);
		opacity: 1;
	}

	.set-btn-skip-on {
		color: var(--color-danger);
		opacity: 1;
	}

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
		padding: var(--space-4) var(--space-5);
		box-shadow: 0 4px 16px rgba(232, 185, 49, 0.06);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.summary-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.summary-ring {
		position: relative;
		width: 28px;
		height: 28px;
		flex-shrink: 0;
	}

	.summary-ring svg {
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
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		color: var(--color-celebrate);
		letter-spacing: var(--tracking-tight);
	}

	.summary .progress {
		margin: 0;
	}

	.summary-stats {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-1-5);
	}

	.summary-stat {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
	}

	.summary-done {
		color: var(--color-activity);
	}

	.summary-skipped {
		color: var(--color-text-secondary);
	}

	.summary-pr {
		color: var(--color-celebrate);
	}

	.summary-volume {
		color: var(--color-text-tertiary);
	}

	.summary-dot {
		color: var(--color-text-tertiary);
		font-size: var(--text-xs);
	}

	/* ═══ Buttons ═══ */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		cursor: pointer;
		border: none;
		text-decoration: none;
		transition: all var(--duration-normal) var(--ease-out);
	}

	.btn-secondary {
		background: transparent;
		color: var(--color-text-secondary);
		border: 1.5px solid var(--color-border);
	}

	.btn-secondary:hover {
		border-color: var(--color-border-strong);
		color: var(--color-text);
	}
</style>
