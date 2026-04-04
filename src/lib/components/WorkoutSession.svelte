<script lang="ts">
	import {
		Check, X, Trophy,
		ChevronDown, TrendingUp, Flame, Dumbbell, ArrowLeftRight
	} from 'lucide-svelte';
	import type { FullPlanDay, FullPlanExercise, FullPlanSet, ExerciseAlternative } from '$lib/types/database';
	import { isPR as isPRUtil, estimatedE1RM } from '$lib/utils/pr';
	import { invalidateAll } from '$app/navigation';
	import { saveDrafts, loadDrafts, clearDraft } from '$lib/utils/set-draft';
	import { addToast } from '$lib/stores/toast.svelte';

	let {
		day,
		unitPref,
		exerciseHistory,
		editMode = false,
	}: {
		day: FullPlanDay;
		unitPref: string;
		exerciseHistory: Record<string, { lastWeight: number; lastReps: number; bestE1RM: number }>;
		editMode?: boolean;
	} = $props();

	// ── Edit Mode (tap-to-select, tap-to-swap) ───────────────
	let selectedExerciseId = $state<string | null>(null);
	let reordering = $state(false);

	// Reset selection when edit mode is toggled off
	$effect(() => {
		if (!editMode) selectedExerciseId = null;
	});

	function handleExerciseTap(exercise: FullPlanExercise) {
		if (!editMode) return;

		if (selectedExerciseId === null) {
			selectedExerciseId = exercise.id;
		} else if (selectedExerciseId === exercise.id) {
			selectedExerciseId = null;
		} else {
			performReorder(selectedExerciseId, exercise.id);
		}
	}

	async function performReorder(idA: string, idB: string) {
		if (reordering) return;
		reordering = true;
		selectedExerciseId = null;

		const sorted = [...day.exercises].sort((a, b) => a.order_index - b.order_index);
		const indexA = sorted.findIndex((e) => e.id === idA);
		const indexB = sorted.findIndex((e) => e.id === idB);

		if (indexA === -1 || indexB === -1) {
			reordering = false;
			return;
		}

		// Swap positions
		const tempOrder = sorted[indexA].order_index;
		sorted[indexA].order_index = sorted[indexB].order_index;
		sorted[indexB].order_index = tempOrder;

		// Optimistic update
		day = { ...day, exercises: [...sorted] };

		try {
			const res = await fetch('/api/reorder-exercises', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					day_id: day.id,
					exercise_order: sorted.map((e) => ({ id: e.id, order_index: e.order_index }))
				})
			});

			if (!res.ok) {
				addToast('Failed to reorder', 'error');
				await invalidateAll();
			}
		} catch {
			addToast('Network error — check your connection', 'error');
			await invalidateAll();
		} finally {
			reordering = false;
		}
	}

	// ── Set State ──────────────────────────────────────────────
	let setStates = $state<Record<string, {
		weight: string;
		reps: string;
		status: 'pending' | 'completed' | 'skipped';
		saving: boolean;
		logId: string | null;
	}>>({});

	$effect(() => {
		const drafts = loadDrafts();
		const updated: typeof setStates = {};
		for (const exercise of day.exercises) {
			for (const set of exercise.sets) {
				const log = set.log;
				const draft = drafts[set.id];
				if ((!log?.status || log.status === 'pending') && draft && (draft.weight || draft.reps)) {
					updated[set.id] = {
						weight: draft.weight,
						reps: draft.reps,
						status: 'pending',
						saving: false,
						logId: log?.id ?? null
					};
					continue;
				}
				updated[set.id] = {
					weight: log?.actual_weight?.toString() ?? '',
					reps: log?.actual_reps?.toString() ?? '',
					status: (log?.status as 'pending' | 'completed' | 'skipped') ?? 'pending',
					saving: false,
					logId: log?.id ?? null
				};
			}
		}
		setStates = updated;
	});

	$effect(() => {
		saveDrafts(setStates);
	});

	// ── Derived Stats ──────────────────────────────────────────
	let totalSets = $derived(day.exercises.reduce((sum, ex) => sum + ex.sets.length, 0));
	let completedSets = $derived(Object.values(setStates).filter((s) => s.status === 'completed').length);
	let skippedSets = $derived(Object.values(setStates).filter((s) => s.status === 'skipped').length);
	let totalVolume = $derived(
		Object.values(setStates).reduce((sum, s) => {
			if (s.status === 'completed' && s.weight && s.reps) {
				return sum + parseFloat(s.weight) * parseInt(s.reps, 10);
			}
			return sum;
		}, 0)
	);
	let allDone = $derived(completedSets + skippedSets === totalSets && totalSets > 0);

	// ── PR Detection ──────────────────────────────────────────
	// One PR per exercise: only the set with the highest e1RM that
	// exceeds the stored best (or any set if first-time exercise).
	function isPR(exerciseId: string, setId: string): boolean {
		const s = setStates[setId];
		if (!s || s.status !== 'completed' || !s.weight || !s.reps) return false;
		const w = parseFloat(s.weight);
		const r = parseInt(s.reps, 10);
		const current = estimatedE1RM(w, r);
		if (current === null) return false;

		// Baseline to beat: server history or 0 (first-time exercise)
		const hist = exerciseHistory[exerciseId];
		const baseline = hist?.bestE1RM ?? 0;
		if (current <= baseline) return false;

		// Find all completed sets for this exercise in the session
		const exercise = day.exercises.find((ex) => ex.exercise_id === exerciseId);
		if (!exercise) return false;

		// This set is a PR only if it has the highest e1RM of the session.
		// On ties, the later set (higher set_number) wins.
		const thisSet = exercise.sets.find((st) => st.id === setId);
		for (const set of exercise.sets) {
			if (set.id === setId) continue;
			const other = setStates[set.id];
			if (!other || other.status !== 'completed' || !other.weight || !other.reps) continue;
			const otherE1RM = estimatedE1RM(parseFloat(other.weight), parseInt(other.reps, 10));
			if (otherE1RM === null) continue;
			if (otherE1RM > current) return false;
			if (otherE1RM === current && thisSet && set.set_number > thisSet.set_number) return false;
		}

		return true;
	}

	let prCount = $derived(
		day.exercises.reduce((sum, ex) =>
			sum + ex.sets.filter((set) => isPR(ex.exercise_id, set.id)).length, 0)
	);

	// ── Per-Exercise Progress ─────────────────────────────────
	const EX_ARC_R = 22;
	const EX_ARC_C = Math.PI * EX_ARC_R;

	function exerciseProgress(exercise: FullPlanExercise) {
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
	function getExerciseState(exercise: FullPlanExercise): ExerciseState {
		const prog = exerciseProgress(exercise);
		if (prog.done === prog.total) return 'completed';
		const sorted = day.exercises.slice().sort((a, b) => a.order_index - b.order_index);
		for (let i = 0; i < sorted.length; i++) {
			if (sorted[i].sets.some((set) => setStates[set.id]?.status === 'pending')) {
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
			.sort((a, b) => a.order_index - b.order_index)
			.flatMap((ex) =>
				ex.sets
					.slice()
					.sort((a, b) => a.set_number - b.set_number)
					.map((set) => {
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
		const sorted = day.exercises.slice().sort((a, b) => a.order_index - b.order_index);
		for (const ex of sorted) {
			if (ex.sets.some((set) => set.log?.status !== 'completed' && set.log?.status !== 'skipped')) return ex.id;
		}
		return sorted[0]?.id ?? null;
	}
	let expandedExercise = $state<string | null>(getInitialExpanded());

	// ── Swipe-to-Flip (Swap Exercise) ─────────────────────────
	let flippedId = $state<string | null>(null);
	let swipingId = $state<string | null>(null);
	let swipeStartX = $state(0);
	let swipeStartY = $state(0);
	let swipeLocked = $state<'horizontal' | 'vertical' | null>(null);
	let didSwipe = $state(false);
	const SWIPE_THRESHOLD = 60;

	function handlePointerDown(e: PointerEvent, exerciseId: string) {
		if (editMode) return;
		if (flippedId && flippedId !== exerciseId) return;
		const tag = (e.target as HTMLElement).tagName;
		if (tag === 'INPUT' || tag === 'BUTTON') return;
		e.preventDefault();
		swipingId = exerciseId;
		swipeStartX = e.clientX;
		swipeStartY = e.clientY;
		swipeLocked = null;
		didSwipe = false;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!swipingId || editMode) return;
		const dx = e.clientX - swipeStartX;
		const dy = e.clientY - swipeStartY;
		if (!swipeLocked && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
			swipeLocked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
		}
		if (swipeLocked === 'vertical') {
			swipingId = null;
			swipeLocked = null;
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (!swipingId || editMode) return;
		const dx = e.clientX - swipeStartX;
		if (swipeLocked === 'horizontal') {
			if (dx < -SWIPE_THRESHOLD && !flippedId) {
				flippedId = swipingId;
				didSwipe = true;
				const exercise = day.exercises.find((e) => e.id === swipingId);
				if (exercise && (!exercise.alternatives || exercise.alternatives.length === 0) && !alternativesCache[exercise.id]) {
					fetchFallbackAlternatives(exercise);
				}
			} else if (dx > SWIPE_THRESHOLD && flippedId === swipingId) {
				flippedId = null;
				didSwipe = true;
			}
		}
		swipingId = null;
		swipeLocked = null;
	}

	function handleCardClick(exerciseId: string, isExpanded: boolean) {
		if (didSwipe) { didSwipe = false; return; }
		if (editMode) return; // In edit mode, card taps are handled by handleExerciseTap
		expandedExercise = isExpanded ? null : exerciseId;
	}

	// ── Swap Alternatives ─────────────────────────────────────
	let alternativesCache = $state<Record<string, ExerciseAlternative[]>>({});
	let loadingAlternatives = $state<Record<string, boolean>>({});
	let swappingId = $state<string | null>(null);

	function getAlternatives(exercise: FullPlanExercise): ExerciseAlternative[] | null {
		if (exercise.alternatives && exercise.alternatives.length > 0) return exercise.alternatives;
		if (alternativesCache[exercise.id]) return alternativesCache[exercise.id];
		return null;
	}

	async function fetchFallbackAlternatives(exercise: FullPlanExercise) {
		if (loadingAlternatives[exercise.id]) return;
		loadingAlternatives[exercise.id] = true;
		try {
			const res = await fetch(`/api/swap-alternatives?exercise_id=${encodeURIComponent(exercise.exercise_id)}`);
			if (res.ok) {
				const { alternatives } = await res.json();
				alternativesCache[exercise.id] = alternatives;
			}
		} finally {
			loadingAlternatives[exercise.id] = false;
		}
	}

	function hasPendingSets(exercise: FullPlanExercise): boolean {
		return exercise.sets.some((s) => setStates[s.id]?.status === 'pending');
	}

	async function handleSwapSelect(exerciseId: string, alt: ExerciseAlternative) {
		if (swappingId) return;
		swappingId = exerciseId;
		try {
			const res = await fetch('/api/swap-exercise', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					planned_exercise_id: exerciseId,
					new_exercise_id: alt.exercise_id,
					new_exercise_name: alt.exercise_name
				})
			});
			if (res.ok) {
				flippedId = null;
				delete alternativesCache[exerciseId];
				await invalidateAll();
				addToast(`Swapped to ${alt.exercise_name}`, 'success');
			} else {
				const { error } = await res.json();
				console.error('[swap] Failed:', error);
				addToast('Swap failed — try again', 'error');
			}
		} finally {
			swappingId = null;
		}
	}

	// ── API Calls ─────────────────────────────────────────────
	async function saveSet(setId: string, status: 'completed' | 'skipped' | 'pending') {
		const s = setStates[setId];
		if (!s || s.saving) return;

		setStates[setId] = { ...s, saving: true, status };
		const fresh = setStates[setId];

		try {
			const res = await fetch('/api/log-set', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					planned_set_id: setId,
					actual_weight: fresh.weight !== '' ? parseFloat(fresh.weight) : null,
					actual_reps: fresh.reps !== '' ? parseInt(fresh.reps, 10) : null,
					status
				})
			});

			const result = await res.json();
			if (res.ok) {
				clearDraft(setId);
				setStates[setId] = { ...setStates[setId], saving: false, logId: result.id };
			} else {
				console.error('Failed to save set:', result.error);
				addToast('Set didn\u2019t save \u2014 try again');
				setStates[setId] = { ...setStates[setId], saving: false, status: s.status };
			}
		} catch (e) {
			console.error('Network error saving set:', e);
			addToast('Network error \u2014 check your connection');
			setStates[setId] = { ...setStates[setId], saving: false, status: s.status };
		}
	}

	function handleComplete(setId: string, exercise: FullPlanExercise) {
		const s = setStates[setId];
		if (!s) return;
		const newStatus = s.status === 'completed' ? 'pending' : 'completed';
		if (newStatus === 'completed') {
			const set = exercise.sets.find((set) => set.id === setId);
			const weight = s.weight || (set?.target_weight != null ? String(set.target_weight) : '');
			const reps = s.reps || (set?.target_reps != null ? String(set.target_reps) : '');
			setStates[setId] = { ...s, weight, reps };
		}
		saveSet(setId, newStatus);
	}

	function handleSkip(setId: string) {
		const s = setStates[setId];
		if (!s) return;
		saveSet(setId, s.status === 'skipped' ? 'pending' : 'skipped');
	}
</script>

{#if day.exercises.length === 0}
	<div class="rest-state">
		<p>Rest day. Recover and prepare for your next session.</p>
		<a href="/plan" class="btn btn-secondary">View Weekly Plan</a>
	</div>
{:else}
	<!-- ═══ Progress Bar / Completion Summary ═══ -->
	{#if allDone}
		<div class="summary">
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
		<div class="progress">
			<div class="progress-track">
				{#each segments as seg, i}
					<div
						class="progress-seg"
						class:seg-activity={seg.color === 'activity'}
						class:seg-celebrate={seg.color === 'celebrate'}
						class:seg-danger={seg.color === 'danger'}
						class:seg-pending={seg.color === 'pending'}
					></div>
				{/each}
			</div>
			<span class="progress-label">{completedSets + skippedSets}/{totalSets}</span>
		</div>
	{/if}

	<!-- ═══ Exercise Cards ═══ -->
	<div class="exercises">
		{#each day.exercises.slice().sort((a, b) => a.order_index - b.order_index) as exercise, i (exercise.exercise_id)}
			{@const prog = exerciseProgress(exercise)}
			{@const exState = getExerciseState(exercise)}
			{@const isExpanded = expandedExercise === exercise.id && !editMode}
			{@const hasPR = exercise.sets.some((s) => isPR(exercise.exercise_id, s.id))}
			{@const hist = exerciseHistory[exercise.exercise_id]}
			{@const isSelected = editMode && selectedExerciseId === exercise.id}

			<div
				class="flip-container"
				class:flipped={flippedId === exercise.id}
				class:selected={isSelected}
				class:reordering
				role={editMode ? 'button' : undefined}
				tabindex={editMode ? 0 : undefined}
				onclick={editMode ? () => handleExerciseTap(exercise) : undefined}
				onkeydown={editMode ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleExerciseTap(exercise); } } : undefined}
				onpointerdown={(e) => {
					if (!editMode && (flippedId === exercise.id || (isExpanded && hasPendingSets(exercise)))) handlePointerDown(e, exercise.id);
				}}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={() => {
					swipingId = null;
					swipeLocked = null;
				}}
			>
				<!-- ═══ FRONT FACE ═══ -->
				<div
					class="card flip-front"
					class:card-completed={exState === 'completed'}
					class:card-active={exState === 'active'}
					class:card-upcoming={exState === 'upcoming'}
				>
					<div class="card-header" role="button" tabindex="0" onclick={() => handleCardClick(exercise.id, isExpanded)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(exercise.id, isExpanded); } }}>

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
					</div>

					{#if isExpanded && exercise.rationale}
						<p class="card-rationale">{exercise.rationale}</p>
					{/if}

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
													class="set-input set-input-weight"
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
												<button class="set-btn set-btn-done" onclick={() => handleComplete(set.id, exercise)} disabled={s.saving} title="Undo">
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
												<button class="set-btn set-btn-confirm" onclick={() => handleComplete(set.id, exercise)} disabled={s.saving} title="Done — log as prescribed">
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

				<!-- ═══ BACK FACE ═══ -->
				<div class="card flip-back">
					<div class="flip-back-header">
						<ArrowLeftRight size={14} strokeWidth={2} />
						<span>Swap {exercise.exercise_name}</span>
						<button class="flip-back-close" onpointerdown={(e) => e.stopPropagation()} onclick={() => flippedId = null} title="Cancel">
							<X size={14} strokeWidth={2} />
						</button>
					</div>
					{#if loadingAlternatives[exercise.id]}
						<div class="swap-loading">Loading alternatives…</div>
					{:else if getAlternatives(exercise)?.length}
						{#each getAlternatives(exercise) ?? [] as alt}
							<button class="swap-alt" onpointerdown={(e) => e.stopPropagation()} onclick={() => handleSwapSelect(exercise.id, alt)} disabled={swappingId === exercise.id}>
								{#if alt.gif_url}
									<div class="swap-alt-gif">
										<img src={alt.gif_url} alt="{alt.exercise_name}" loading="lazy" onload={(e) => (e.currentTarget as HTMLImageElement).classList.add('loaded')} />
									</div>
								{/if}
								<div class="swap-alt-info">
									<span class="swap-alt-name">{alt.exercise_name}</span>
									{#if alt.target}<span class="swap-alt-target">{alt.target}</span>{/if}
								</div>
								{#if alt.equipment}<span class="swap-alt-equip">{alt.equipment}</span>{/if}
							</button>
						{/each}
					{:else}
						<div class="swap-empty">No alternatives available</div>
					{/if}
				</div>
			</div>


		{/each}
	</div>


{/if}

<style>
	/* ═══ Animations ═══ */
	@keyframes arcDraw {
		from { stroke-dashoffset: 69; }
	}

	.arc-fill {
		animation: arcDraw 0.8s var(--ease-out) both;
		animation-delay: 400ms;
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
		touch-action: pan-y;
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

	/* ═══ Edit Mode (tap-to-select) ═══ */
	.flip-container.selected > .flip-front {
		border-color: var(--color-activity);
		box-shadow: var(--shadow-glow);
	}

	.flip-container.reordering {
		opacity: 0.5;
		pointer-events: none;
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

	.card-rationale {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		font-style: italic;
		padding: 0 var(--space-4) var(--space-2);
		margin-top: calc(-1 * var(--space-2));
		opacity: 0.7;
	}

	/* ═══ Card Flip (Swap) ═══ */
	.flip-container {
		perspective: 800px;
		position: relative;
	}

	.flip-container .flip-front,
	.flip-container .flip-back {
		backface-visibility: hidden;
		transition: transform 0.5s var(--ease-out);
	}

	.flip-container .flip-front {
		transform: rotateY(0deg);
	}

	.flip-container .flip-back {
		position: absolute;
		inset: 0;
		transform: rotateY(180deg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.flip-container.flipped .flip-front {
		transform: rotateY(-180deg);
		pointer-events: none;
		visibility: hidden;
		position: absolute;
		inset: 0;
	}

	.flip-container.flipped .flip-back {
		transform: rotateY(0deg);
		position: relative;
		inset: auto;
	}

	.flip-back-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-rest);
		text-transform: capitalize;
		border-bottom: 1px dashed var(--color-border);
	}

	.flip-back-close {
		margin-left: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		background: transparent;
		color: var(--color-text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: color var(--duration-fast);
	}

	.flip-back-close:hover {
		color: var(--color-text);
	}

	.swap-alt {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		background: none;
		border: none;
		border-top: 1px solid var(--color-border-subtle);
		color: var(--color-text);
		cursor: pointer;
		transition: background var(--duration-fast);
		text-align: left;
	}

	.swap-alt:first-of-type {
		border-top: none;
	}

	.swap-alt:hover {
		background: var(--color-surface-hover);
	}

	.swap-alt:active {
		background: var(--color-surface-active);
	}

	.swap-alt:disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.swap-alt-gif {
		width: 56px;
		height: 56px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		flex-shrink: 0;
		background: linear-gradient(
			90deg,
			var(--color-bg) 25%,
			var(--color-surface-hover) 50%,
			var(--color-bg) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
		border: 1px solid var(--color-border-subtle);
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.swap-alt-gif img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.swap-alt-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.swap-alt-name {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		text-transform: capitalize;
		line-height: var(--leading-tight);
	}

	.swap-alt-target {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		text-transform: capitalize;
		line-height: var(--leading-normal);
	}

	.swap-alt-equip {
		flex-shrink: 0;
		align-self: center;
		font-family: var(--font-mono);
		font-size: var(--text-2xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
		text-transform: capitalize;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		padding: var(--space-0-5) var(--space-2);
		border-radius: var(--radius-xs);
		white-space: nowrap;
	}

	.swap-loading,
	.swap-empty {
		padding: var(--space-3);
		text-align: center;
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
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
		width: 2ch;
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

	.set-input-weight {
		width: 4ch;
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
