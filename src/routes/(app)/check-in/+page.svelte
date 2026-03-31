<script lang="ts">
	import type { UserSettings } from '$lib/types/database';
	import { ChevronLeft, ChevronRight, Sparkles, X, Plus } from 'lucide-svelte';
	import { navigating } from '$app/stores';

	let { data, form } = $props();
	const plan = $derived(data.plan);
	const settings = $derived(data.settings as UserSettings);
	const weekStats = $derived(data.weekStats);

	// ── Entrance animation guard ──────────────────────────────
	let isClientNav = $state(false);
	$effect(() => {
		if ($navigating) isClientNav = true;
	});
	let shouldAnimate = $derived(!isClientNav);

	// ── Form state ────────────────────────────────────────────
	let bodyWeight = $state('');
	let energyLevel = $state<string | null>(null);
	let trainingDays = $state<number[]>([]);
	let sessionDuration = $state(60);
	let injuries = $state<string[]>([]);
	let equipment = $state<string[]>([]);
	let newInjury = $state('');
	let notes = $state('');
	let submitting = $state(false);

	// Pre-fill from settings (equipment is stored as user-facing names)
	$effect(() => {
		trainingDays = [...settings.training_days];
		sessionDuration = settings.session_duration_minutes;
		injuries = [...settings.injuries];
		equipment = settings.equipment.filter((e: string) => e !== 'body weight');
	});

	const completionRate = $derived(weekStats.totalSets > 0
		? Math.round((weekStats.completedSets / weekStats.totalSets) * 100)
		: 0);

	// ── Recovery options ──────────────────────────────────────
	const recoveryOptions = [
		{ value: 'fully_recovered', label: 'Fully Recovered' },
		{ value: 'mostly_recovered', label: 'Mostly Recovered' },
		{ value: 'still_fatigued', label: 'Still Fatigued' },
		{ value: 'beat_up', label: 'Beat Up' }
	];

	// ── Training day helpers ──────────────────────────────────
	const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	function toggleTrainingDay(dayIndex: number) {
		if (trainingDays.includes(dayIndex)) {
			trainingDays = trainingDays.filter((d) => d !== dayIndex);
		} else if (trainingDays.length < 6) {
			trainingDays = [...trainingDays, dayIndex].sort((a, b) => a - b);
		}
	}

	const durationOptions = [30, 45, 60, 75, 90];

	// ── Equipment helpers ─────────────────────────────────────
	const equipmentOptions = [
		'barbell', 'dumbbell', 'ez barbell', 'kettlebell',
		'cable', 'machine', 'smith machine',
		'bench', 'squat rack', 'pull-up bar',
		'resistance band'
	];

	function toggleEquipment(item: string) {
		if (equipment.includes(item)) {
			equipment = equipment.filter((e) => e !== item);
		} else {
			equipment = [...equipment, item];
		}
	}

	function selectAllEquipment() {
		equipment = [...equipmentOptions];
	}

	function clearEquipment() {
		equipment = [];
	}

	let allEquipmentSelected = $derived(equipment.length === equipmentOptions.length);

	// ── Injury helpers ────────────────────────────────────────
	function removeInjury(injury: string) {
		injuries = injuries.filter((i) => i !== injury);
	}

	function addInjury() {
		const trimmed = newInjury.trim();
		if (trimmed && !injuries.includes(trimmed)) {
			injuries = [...injuries, trimmed];
		}
		newInjury = '';
	}

	function handleInjuryKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addInjury();
		}
	}

	// ── Collapsible sections ─────────────────────────────────
	let scheduleOpen = $state(false);
	let injuriesOpen = $state(false);
	let equipmentOpen = $state(false);

	// Summary strings for collapsed state
	const scheduleSummary = $derived(
		trainingDays.map((d: number) => DAY_NAMES[d]).join(', ') + ` · ${sessionDuration} min`
	);
	const injurySummary = $derived(
		injuries.length > 0 ? injuries.join(', ') : 'None'
	);
	const equipmentSummary = $derived(
		equipment.length > 0 ? equipment.map((e: string) => e.replace(/\b\w/g, c => c.toUpperCase())).join(', ') : 'None selected'
	);

	// ── Validation ────────────────────────────────────────────
	let canSubmit = $derived(trainingDays.length >= 2 && equipment.length > 0);
</script>

<svelte:head>
	<title>Push — Week {plan.week_number} Check-In</title>
</svelte:head>

<div class="checkin-page">
	<!-- ═══ Header ═══ -->
	<header class="checkin-header">
		<div class="header-bar">
			<a href="/plan" class="back-btn" title="Back to plan">
				<ChevronLeft size={20} strokeWidth={2.5} />
			</a>
			<div class="header-context">
				<h1 class="header-title">Check-In</h1>
				<span class="header-week">Week {plan.week_number}</span>
			</div>
			<div class="header-slot"></div>
		</div>
	</header>

	<!-- ═══ Week Summary ═══ -->
	<div class="week-summary" class:push-up={shouldAnimate} style="--d:0">
		<div class="summary-header">
			<span class="summary-label">Your Week</span>
			<span
				class="summary-pct"
				class:pct-high={completionRate >= 80}
				class:pct-mid={completionRate >= 50 && completionRate < 80}
				class:pct-low={completionRate < 50}
			>{completionRate}%</span>
		</div>
		<div class="summary-bar">
			<div class="summary-bar-fill" style="width: {completionRate}%"></div>
		</div>
		<div class="stats-row">
			<div class="stat">
				<span class="stat-value">{weekStats.daysWorkedOut}</span>
				<span class="stat-label">Days</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-value">{weekStats.totalVolume > 0 ? (weekStats.totalVolume / 1000).toFixed(1) + 'k' : '0'}</span>
				<span class="stat-label">Volume</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-value">{weekStats.skippedSets}</span>
				<span class="stat-label">Skipped</span>
			</div>
		</div>
	</div>

	{#if form?.error}
		<div class="error-banner" class:push-up={shouldAnimate} style="--d:1">
			{form.error}
		</div>
	{/if}

	<form method="POST" class="checkin-form" onsubmit={() => { submitting = true; }}>
		<input type="hidden" name="week_number" value={plan.week_number} />

		<!-- ═══ Recovery ═══ -->
		<div class="form-card" class:push-up={shouldAnimate} style="--d:1">
			<span class="card-title">How did your body recover this week?</span>
			<span class="card-hint">Helps your coach manage training intensity.</span>
			<div class="recovery-chips">
				{#each recoveryOptions as option}
					<button
						type="button"
						class="recovery-chip"
						class:selected={energyLevel === option.value}
						onclick={() => energyLevel = energyLevel === option.value ? null : option.value}
					>
						{option.label}
					</button>
				{/each}
			</div>
			{#if energyLevel}
				<input type="hidden" name="energy_level" value={energyLevel} />
			{/if}
		</div>

		<!-- ═══ Body Weight ═══ -->
		<div class="form-card" class:push-up={shouldAnimate} style="--d:2">
			<label for="body_weight" class="card-title">Body Weight</label>
			<span class="card-hint">Optional — used for tracking trends</span>
			<div class="input-with-unit">
				<input
					type="number"
					id="body_weight"
					name="body_weight"
					inputmode="decimal"
					step="0.1"
					placeholder="e.g. 180"
					bind:value={bodyWeight}
					class="form-input"
				/>
				<span class="input-unit">{settings.unit_pref}</span>
			</div>
		</div>

		<!-- ═══ Schedule ═══ -->
		<div class="form-card" class:push-up={shouldAnimate} style="--d:3">
			<button type="button" class="card-toggle" onclick={() => scheduleOpen = !scheduleOpen}>
				<div class="card-toggle-text">
					<span class="card-title">Next Week's Schedule</span>
					{#if !scheduleOpen}
						<span class="card-summary">{scheduleSummary}</span>
					{/if}
				</div>
				<span class="card-toggle-icon" class:open={scheduleOpen}>
					<ChevronRight size={16} strokeWidth={2} />
				</span>
			</button>

			{#if scheduleOpen}
				<div class="card-body">
					<span class="card-hint">Tap to adjust which days you're training</span>
					<div class="day-picker">
						{#each DAY_NAMES as name, i}
							<button
								type="button"
								class="day-chip"
								class:selected={trainingDays.includes(i)}
								onclick={() => toggleTrainingDay(i)}
							>
								{name}
							</button>
						{/each}
					</div>

					<span class="sub-label">Session length</span>
					<div class="duration-chips">
						{#each durationOptions as dur}
							<button
								type="button"
								class="duration-chip"
								class:selected={sessionDuration === dur}
								onclick={() => sessionDuration = dur}
							>
								{dur}m
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#each trainingDays as d}
				<input type="hidden" name="training_days" value={d} />
			{/each}
			<input type="hidden" name="session_duration_minutes" value={sessionDuration} />
		</div>

		<!-- ═══ Injuries ═══ -->
		<div class="form-card" class:push-up={shouldAnimate} style="--d:4">
			<button type="button" class="card-toggle" onclick={() => injuriesOpen = !injuriesOpen}>
				<div class="card-toggle-text">
					<span class="card-title">Injuries</span>
					{#if !injuriesOpen}
						<span class="card-summary">{injurySummary}</span>
					{/if}
				</div>
				<span class="card-toggle-icon" class:open={injuriesOpen}>
					<ChevronRight size={16} strokeWidth={2} />
				</span>
			</button>

			{#if injuriesOpen}
				<div class="card-body">
					<span class="card-hint">Update if anything has changed</span>

					{#if injuries.length > 0}
						<div class="injury-tags">
							{#each injuries as injury}
								<span class="injury-tag">
									{injury}
									<button type="button" class="tag-remove" onclick={() => removeInjury(injury)} title="Remove {injury}">
										<X size={12} strokeWidth={2.5} />
									</button>
								</span>
							{/each}
						</div>
					{/if}

					<div class="add-injury-row">
						<input
							type="text"
							placeholder="Add injury..."
							bind:value={newInjury}
							onkeydown={handleInjuryKeydown}
							class="form-input injury-input"
						/>
						<button type="button" class="add-btn" onclick={addInjury} disabled={!newInjury.trim()}>
							<Plus size={16} strokeWidth={2.5} />
						</button>
					</div>
				</div>
			{/if}

			{#each injuries as injury}
				<input type="hidden" name="injuries" value={injury} />
			{/each}
		</div>

		<!-- ═══ Equipment ═══ -->
		<div class="form-card" class:push-up={shouldAnimate} style="--d:5">
			<button type="button" class="card-toggle" onclick={() => equipmentOpen = !equipmentOpen}>
				<div class="card-toggle-text">
					<span class="card-title">Equipment</span>
					{#if !equipmentOpen}
						<span class="card-summary">{equipmentSummary}</span>
					{/if}
				</div>
				<span class="card-toggle-icon" class:open={equipmentOpen}>
					<ChevronRight size={16} strokeWidth={2} />
				</span>
			</button>

			{#if equipmentOpen}
				<div class="card-body">
					<div class="card-title-row">
						<span class="card-hint">Tap to update your access</span>
						<button type="button" class="text-btn" onclick={allEquipmentSelected ? clearEquipment : selectAllEquipment}>
							{allEquipmentSelected ? 'Clear All' : 'Select All'}
						</button>
					</div>

					<div class="equipment-section">
						<span class="group-label">Free weights</span>
						<div class="equipment-chips">
							{#each ['barbell', 'dumbbell', 'ez barbell', 'kettlebell'] as item}
								<button type="button" class="equipment-chip" class:selected={equipment.includes(item)} onclick={() => toggleEquipment(item)}>{item}</button>
							{/each}
						</div>
					</div>

					<div class="equipment-section">
						<span class="group-label">Machines & cables</span>
						<div class="equipment-chips">
							{#each ['cable', 'machine', 'smith machine'] as item}
								<button type="button" class="equipment-chip" class:selected={equipment.includes(item)} onclick={() => toggleEquipment(item)}>{item}</button>
							{/each}
						</div>
					</div>

					<div class="equipment-section">
						<span class="group-label">Stations</span>
						<div class="equipment-chips">
							{#each ['bench', 'squat rack', 'pull-up bar'] as item}
								<button type="button" class="equipment-chip" class:selected={equipment.includes(item)} onclick={() => toggleEquipment(item)}>{item}</button>
							{/each}
						</div>
					</div>

					<div class="equipment-section">
						<span class="group-label">Other</span>
						<div class="equipment-chips">
							{#each ['resistance band'] as item}
								<button type="button" class="equipment-chip" class:selected={equipment.includes(item)} onclick={() => toggleEquipment(item)}>{item}</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			{#each equipment as eq}
				<input type="hidden" name="equipment" value={eq} />
			{/each}
		</div>

		<!-- ═══ Notes ═══ -->
		<div class="form-card" class:push-up={shouldAnimate} style="--d:6">
			<label for="notes" class="card-title">Notes for Your Coach</label>
			<span class="card-hint">Preferences, schedule changes, anything your coach should know</span>
			<textarea
				id="notes"
				name="notes"
				placeholder="e.g. Traveling Thursday, prefer heavier legs"
				bind:value={notes}
				rows="3"
				class="form-textarea"
			></textarea>
		</div>

		<!-- ═══ Submit ═══ -->
		<button
			type="submit"
			class="submit-btn"
			class:push-up={shouldAnimate}
			style="--d:7"
			disabled={submitting || !canSubmit}
		>
			{#if submitting}
				<span class="btn-spinner"></span>
				Generating Week {plan.week_number + 1}...
			{:else}
				<Sparkles size={16} strokeWidth={2} />
				Generate Week {plan.week_number + 1}
			{/if}
		</button>
	</form>
</div>

<style>
	/* ═══ Page Container ═══ */
	.checkin-page {
		min-height: 100vh;
		min-height: 100dvh;
		padding: var(--page-pad-top) var(--page-gutter) var(--page-pad-bottom);
		max-width: var(--page-max-width);
		margin: 0 auto;
	}

	/* ═══ Header ═══ */
	.checkin-header {
		margin-bottom: var(--space-6);
	}

	.header-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: all var(--duration-normal) var(--ease-out);
		flex-shrink: 0;
		-webkit-tap-highlight-color: transparent;
	}

	.back-btn:hover {
		border-color: var(--color-border-strong);
		color: var(--color-text);
	}

	.header-context {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.header-title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-text);
	}

	.header-week {
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		font-weight: var(--weight-bold);
		color: var(--color-reflect);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
	}

	.header-slot {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}

	/* ═══ Week Summary ═══ */
	.week-summary {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.summary-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.summary-label {
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		font-weight: var(--weight-bold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-tertiary);
	}

	.summary-pct {
		font-family: var(--font-mono);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
	}

	.summary-pct.pct-high { color: var(--color-activity); }
	.summary-pct.pct-mid { color: var(--color-celebrate); }
	.summary-pct.pct-low { color: var(--color-danger); }

	.summary-bar {
		height: 4px;
		background: var(--color-border);
		border-radius: var(--radius-full);
		overflow: hidden;
		margin-bottom: var(--space-4);
	}

	.summary-bar-fill {
		height: 100%;
		background: var(--color-reflect);
		border-radius: var(--radius-full);
		transition: width var(--duration-slow) var(--ease-out);
	}

	.stats-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		flex: 1;
	}

	.stat-value {
		font-family: var(--font-mono);
		font-size: var(--text-base);
		font-weight: var(--weight-bold);
		color: var(--color-text);
	}

	.stat-label {
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		color: var(--color-text-tertiary);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
	}

	.stat-divider {
		width: 1px;
		height: 24px;
		background: var(--color-border);
	}

	/* ═══ Error Banner ═══ */
	.error-banner {
		background: var(--color-danger-muted);
		border: 1px solid var(--color-danger);
		color: var(--color-danger);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		margin-bottom: var(--space-4);
	}

	/* ═══ Form ═══ */
	.checkin-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.form-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.card-toggle {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
		width: 100%;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		-webkit-tap-highlight-color: transparent;
	}

	.card-toggle-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.card-summary {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		line-height: var(--leading-normal);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.card-toggle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		color: var(--color-text-tertiary);
		flex-shrink: 0;
		transition: transform var(--duration-normal) var(--ease-out),
					color var(--duration-normal) var(--ease-out);
	}

	.card-toggle-icon.open {
		transform: rotate(90deg);
	}

	.card-toggle:hover .card-toggle-icon {
		color: var(--color-text-secondary);
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.card-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-title {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.card-hint {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		line-height: var(--leading-normal);
	}

	.sub-label {
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
		margin-top: var(--space-2);
	}

	/* ═══ Recovery Chips ═══ */
	.recovery-chips {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}

	.recovery-chip {
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		text-align: left;
		-webkit-tap-highlight-color: transparent;
	}

	.recovery-chip:hover {
		border-color: var(--color-border-strong);
	}

	.recovery-chip.selected {
		background: var(--color-reflect-muted);
		border-color: var(--color-reflect);
		color: var(--color-reflect);
		font-weight: var(--weight-semibold);
	}

	/* ═══ Inputs ═══ */
	.input-with-unit {
		position: relative;
	}

	.input-unit {
		position: absolute;
		right: var(--space-3);
		top: 50%;
		transform: translateY(-50%);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		pointer-events: none;
	}

	.form-input,
	.form-textarea {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		outline: none;
		transition: border-color var(--duration-normal) var(--ease-out);
	}

	.form-input:focus,
	.form-textarea:focus {
		border-color: var(--color-reflect);
	}

	.form-input::placeholder,
	.form-textarea::placeholder {
		color: var(--color-text-tertiary);
	}

	.form-textarea {
		resize: vertical;
		min-height: 52px;
	}

	.form-input[type="number"]::-webkit-outer-spin-button,
	.form-input[type="number"]::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	.form-input[type="number"] {
		-moz-appearance: textfield;
		appearance: textfield;
		padding-right: var(--space-10);
	}

	/* ═══ Day Picker ═══ */
	.day-picker {
		display: flex;
		gap: var(--space-1);
		margin-top: var(--space-1);
	}

	.day-chip {
		flex: 1;
		padding: var(--space-2) 0;
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		text-align: center;
		-webkit-tap-highlight-color: transparent;
	}

	.day-chip:hover {
		border-color: var(--color-border-strong);
	}

	.day-chip.selected {
		background: var(--color-reflect-muted);
		border-color: var(--color-reflect);
		color: var(--color-reflect);
		font-weight: var(--weight-semibold);
	}

	/* ═══ Duration Chips ═══ */
	.duration-chips {
		display: flex;
		gap: var(--space-1);
		margin-top: var(--space-1);
	}

	.duration-chip {
		flex: 1;
		padding: var(--space-2) 0;
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		text-align: center;
		-webkit-tap-highlight-color: transparent;
	}

	.duration-chip:hover {
		border-color: var(--color-border-strong);
	}

	.duration-chip.selected {
		background: var(--color-reflect-muted);
		border-color: var(--color-reflect);
		color: var(--color-reflect);
		font-weight: var(--weight-semibold);
	}

	/* ═══ Injury Tags ═══ */
	.injury-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}

	.injury-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
		background: var(--color-danger-muted);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius-full);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		color: var(--color-danger);
		white-space: nowrap;
	}

	.tag-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		background: none;
		color: var(--color-danger);
		cursor: pointer;
		border-radius: var(--radius-full);
		transition: background var(--duration-fast) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
		padding: 0;
	}

	.tag-remove:hover {
		background: var(--color-danger-muted);
	}

	.add-injury-row {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}

	.injury-input {
		flex: 1;
	}

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		flex-shrink: 0;
		-webkit-tap-highlight-color: transparent;
	}

	.add-btn:hover:not(:disabled) {
		border-color: var(--color-reflect);
		color: var(--color-reflect);
	}

	.add-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ═══ Equipment ═══ */
	.equipment-section {
		margin-bottom: var(--space-3);
	}

	.equipment-section:last-of-type {
		margin-bottom: 0;
	}

	.group-label {
		display: block;
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-tertiary);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		margin-bottom: var(--space-2);
	}

	.equipment-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}

	.equipment-chip {
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		text-transform: capitalize;
		-webkit-tap-highlight-color: transparent;
	}

	.equipment-chip:hover {
		border-color: var(--color-border-strong);
	}

	.equipment-chip.selected {
		background: var(--color-reflect-muted);
		border-color: var(--color-reflect);
		color: var(--color-reflect);
		font-weight: var(--weight-semibold);
	}

	.text-btn {
		background: none;
		border: none;
		color: var(--color-text-tertiary);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		cursor: pointer;
		padding: var(--space-1) 0;
		transition: color var(--duration-normal) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.text-btn:hover {
		color: var(--color-text-secondary);
	}

	/* ═══ Submit Button ═══ */
	.submit-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-6);
		background: var(--color-reflect);
		color: var(--color-text-inverse);
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		margin-top: var(--space-2);
		transition: all var(--duration-normal) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--color-reflect-hover);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.submit-btn :global(svg) {
		flex-shrink: 0;
	}

	.btn-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: var(--color-text-inverse);
		border-radius: var(--radius-full);
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ═══ Entrance Animation ═══ */
	.push-up {
		animation: pushUp var(--duration-slow) var(--ease-out) calc(var(--d) * 60ms) both;
	}

	@keyframes pushUp {
		from { opacity: 0; transform: translateY(12px); }
		to   { opacity: 1; transform: translateY(0); }
	}
</style>
