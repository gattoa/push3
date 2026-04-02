<script lang="ts">
	import type { UserSettings } from '$lib/types/database';
	import { ChevronLeft, ChevronRight, X, Plus, LogOut } from 'lucide-svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/stores/toast.svelte';
	import { EQUIPMENT_GROUPS } from '$lib/equipment-options';

	let { data } = $props();
	const settings = $derived(data.settings as UserSettings);

	// ── Auth data ─────────────────────────────────────────────
	const user = $derived(page.data.user);
	const displayName = $derived(user?.user_metadata?.full_name ?? user?.email ?? '');
	const email = $derived(user?.email ?? '');
	const avatarUrl = $derived(user?.user_metadata?.avatar_url ?? null);
	const initials = $derived(
		user?.user_metadata?.full_name
			? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
			: user?.email?.[0]?.toUpperCase() ?? '?'
	);

	// ── Form state ────────────────────────────────────────────
	let dateOfBirth = $state('');
	let gender = $state('');
	let goals = $state('');
	let experienceLevel = $state('');
	let trainingDays = $state<number[]>([]);
	let sessionDuration = $state(60);
	let injuries = $state<string[]>([]);
	let equipment = $state<string[]>([]);
	let unitPref = $state<'lb' | 'kg'>('lb');
	let checkInDay = $state(6);
	let newInjury = $state('');

	// Pre-fill from settings
	$effect(() => {
		dateOfBirth = settings.date_of_birth ?? '';
		gender = settings.gender ?? '';
		goals = settings.goals ?? '';
		experienceLevel = settings.experience_level ?? '';
		trainingDays = [...settings.training_days];
		sessionDuration = settings.session_duration_minutes;
		checkInDay = settings.check_in_day ?? 6;
		injuries = [...settings.injuries];
		equipment = settings.equipment.filter((e: string) => e !== 'body weight');
		unitPref = settings.unit_pref;
	});

	// ── Collapsible sections ─────────────────────────────────
	let personalOpen = $state(false);
	let goalsOpen = $state(false);
	let injuriesOpen = $state(false);
	let equipmentOpen = $state(false);

	// ── Summaries ─────────────────────────────────────────────
	const personalSummary = $derived.by(() => {
		const parts: string[] = [];
		if (dateOfBirth) {
			const d = new Date(dateOfBirth + 'T00:00:00');
			parts.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
		}
		if (gender) {
			const labels: Record<string, string> = { male: 'Male', female: 'Female', prefer_not_to_say: 'Prefer not to say' };
			parts.push(labels[gender] ?? gender);
		}
		return parts.length > 0 ? parts.join(' · ') : 'Not set';
	});

	const goalLabels: Record<string, string> = {
		build_muscle: 'Build Muscle',
		build_strength: 'Build Strength',
		lose_fat: 'Lose Fat',
		general_fitness: 'General Fitness'
	};
	const experienceLabels: Record<string, string> = {
		beginner: 'Beginner',
		intermediate: 'Intermediate',
		advanced: 'Advanced'
	};

	const goalsSummary = $derived.by(() => {
		const parts: string[] = [];
		if (goals) parts.push(goalLabels[goals] ?? goals);
		if (experienceLevel) parts.push(experienceLabels[experienceLevel] ?? experienceLevel);
		return parts.length > 0 ? parts.join(' · ') : 'Not set';
	});

	const injurySummary = $derived(injuries.length > 0 ? injuries.join(', ') : 'None');
	const equipmentSummary = $derived(
		equipment.length > 0
			? equipment.map((e: string) => e.replace(/\b\w/g, c => c.toUpperCase())).join(', ')
			: 'None selected'
	);

	// ── Options ───────────────────────────────────────────────
	const genderOptions = [
		{ value: 'male', label: 'Male' },
		{ value: 'female', label: 'Female' },
		{ value: 'prefer_not_to_say', label: 'Prefer not to say' }
	];

	const experienceOptions = [
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' }
	];

	const goalOptions = [
		{ value: 'build_muscle', label: 'Build Muscle' },
		{ value: 'build_strength', label: 'Build Strength' },
		{ value: 'lose_fat', label: 'Lose Fat' },
		{ value: 'general_fitness', label: 'General Fitness' }
	];

	const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const durationOptions = [30, 45, 60, 75, 90];

	// ── Auto-save ─────────────────────────────────────────────
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	async function saveSettings(updates: Record<string, unknown>) {
		try {
			const res = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});
			if (res.ok) {
				addToast('Settings saved', 'success');
			} else {
				const data = await res.json();
				addToast(data.error || 'Failed to save', 'error');
			}
		} catch {
			addToast('Failed to save settings', 'error');
		}
	}

	function debouncedSave(updates: Record<string, unknown>) {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => saveSettings(updates), 800);
	}

	// ── Field handlers ────────────────────────────────────────
	function setUnitPref(pref: 'lb' | 'kg') {
		unitPref = pref;
		saveSettings({ unit_pref: pref });
	}

	function setGender(value: string) {
		gender = value;
		saveSettings({ gender: value });
	}

	function setGoals(value: string) {
		goals = value;
		saveSettings({ goals: value });
	}

	function setExperience(value: string) {
		experienceLevel = value;
		saveSettings({ experience_level: value });
	}

	function setSessionDuration(value: number) {
		sessionDuration = value;
		saveSettings({ session_duration_minutes: value });
	}

	function setCheckInDay(dayIndex: number) {
		checkInDay = dayIndex;
		saveSettings({ check_in_day: dayIndex });
	}

	function toggleTrainingDay(dayIndex: number) {
		if (trainingDays.includes(dayIndex)) {
			trainingDays = trainingDays.filter((d) => d !== dayIndex);
		} else if (trainingDays.length < 6) {
			trainingDays = [...trainingDays, dayIndex].sort((a, b) => a - b);
		}
		if (trainingDays.length >= 2) {
			debouncedSave({ training_days: trainingDays });
		}
	}

	function toggleEquipment(item: string) {
		if (equipment.includes(item)) {
			equipment = equipment.filter((e) => e !== item);
		} else {
			equipment = [...equipment, item];
		}
		if (equipment.length >= 1) {
			debouncedSave({ equipment });
		}
	}

	const allEquipmentItems = EQUIPMENT_GROUPS.flatMap(g => [...g.items]);
	let allEquipmentSelected = $derived(equipment.length === allEquipmentItems.length);

	function selectAllEquipment() {
		equipment = [...allEquipmentItems];
		debouncedSave({ equipment });
	}

	function clearEquipment() {
		equipment = [];
		// Don't save empty — validation will reject it
	}

	function removeInjury(injury: string) {
		injuries = injuries.filter((i) => i !== injury);
		saveSettings({ injuries });
	}

	function addInjury() {
		const trimmed = newInjury.trim();
		if (trimmed && !injuries.includes(trimmed)) {
			injuries = [...injuries, trimmed];
			saveSettings({ injuries });
		}
		newInjury = '';
	}

	function handleInjuryKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addInjury();
		}
	}

	async function signOut() {
		await page.data.supabase?.auth.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Push — Settings</title>
</svelte:head>

<div class="settings-page">
	<!-- ═══ Header ═══ -->
	<header class="settings-header">
		<div class="header-bar">
			<button class="back-btn" onclick={() => history.back()} title="Back">
				<ChevronLeft size={20} strokeWidth={2.5} />
			</button>
			<h1 class="header-title">Settings</h1>
			<div class="header-slot"></div>
		</div>
	</header>

	<!-- ═══ Account Header ═══ -->
	<div class="account-header">
		<div class="account-avatar">
			{#if avatarUrl}
				<img src={avatarUrl} alt="Avatar" class="account-avatar-img" referrerpolicy="no-referrer" />
			{:else}
				<span class="account-initials">{initials}</span>
			{/if}
		</div>
		<div class="account-info">
			<span class="account-name">{displayName}</span>
			<span class="account-email">{email}</span>
		</div>
	</div>

	<!-- ═══ PROFILE ═══ -->
	<div class="section-label">Profile</div>

	<!-- Personal (collapsible) -->
	<div class="form-card">
		<button type="button" class="card-toggle" onclick={() => personalOpen = !personalOpen}>
			<div class="card-toggle-text">
				<span class="card-title">Personal</span>
				{#if !personalOpen}
					<span class="card-summary">{personalSummary}</span>
				{/if}
			</div>
			<span class="card-toggle-icon" class:open={personalOpen}>
				<ChevronRight size={16} strokeWidth={2} />
			</span>
		</button>

		{#if personalOpen}
			<div class="card-body">
				<div class="field-group">
					<label for="dob" class="field-label">Date of birth</label>
					<input
						type="date"
						id="dob"
						class="form-input"
						value={dateOfBirth}
						max={new Date().toISOString().split('T')[0]}
						onchange={(e) => {
							dateOfBirth = (e.target as HTMLInputElement).value;
							saveSettings({ date_of_birth: dateOfBirth });
						}}
					/>
				</div>
				<div class="field-group">
					<span class="field-label">Gender</span>
					<div class="chip-row">
						{#each genderOptions as opt}
							<button
								type="button"
								class="chip"
								class:selected={gender === opt.value}
								onclick={() => setGender(opt.value)}
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Goals & Experience (collapsible) -->
	<div class="form-card">
		<button type="button" class="card-toggle" onclick={() => goalsOpen = !goalsOpen}>
			<div class="card-toggle-text">
				<span class="card-title">Goals & Experience</span>
				{#if !goalsOpen}
					<span class="card-summary">{goalsSummary}</span>
				{/if}
			</div>
			<span class="card-toggle-icon" class:open={goalsOpen}>
				<ChevronRight size={16} strokeWidth={2} />
			</span>
		</button>

		{#if goalsOpen}
			<div class="card-body">
				<div class="field-group">
					<span class="field-label">Goal</span>
					<div class="chip-column">
						{#each goalOptions as opt}
							<button
								type="button"
								class="chip"
								class:selected={goals === opt.value}
								onclick={() => setGoals(opt.value)}
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>
				<div class="field-group">
					<span class="field-label">Experience</span>
					<div class="chip-row">
						{#each experienceOptions as opt}
							<button
								type="button"
								class="chip"
								class:selected={experienceLevel === opt.value}
								onclick={() => setExperience(opt.value)}
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Schedule (always open) -->
	<div class="form-card">
		<span class="card-title">Schedule</span>
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
					onclick={() => setSessionDuration(dur)}
				>
					{dur}m
				</button>
			{/each}
		</div>
		<div class="check-in-row">
			<span class="check-in-label">Check in on</span>
			<select
				class="check-in-select"
				value={checkInDay}
				onchange={(e) => setCheckInDay(parseInt(e.currentTarget.value, 10))}
			>
				{#each DAY_NAMES as name, i}
					<option value={i}>{name}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Injuries (collapsible) -->
	<div class="form-card">
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
	</div>

	<!-- ═══ PREFERENCES ═══ -->
	<div class="section-label">Preferences</div>

	<!-- Equipment (collapsible) -->
	<div class="form-card">
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

				{#each EQUIPMENT_GROUPS as group}
					<div class="equipment-section">
						<span class="group-label">{group.label}</span>
						<div class="equipment-chips">
							{#each group.items as item}
								<button
									type="button"
									class="equipment-chip"
									class:selected={equipment.includes(item)}
									onclick={() => toggleEquipment(item)}
								>
									{item}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Units (always open) -->
	<div class="form-card">
		<span class="card-title">Units</span>
		<div class="unit-toggle">
			<button
				type="button"
				class="unit-btn"
				class:selected={unitPref === 'lb'}
				onclick={() => setUnitPref('lb')}
			>lb</button>
			<button
				type="button"
				class="unit-btn"
				class:selected={unitPref === 'kg'}
				onclick={() => setUnitPref('kg')}
			>kg</button>
		</div>
	</div>

	<!-- Deferred effect note -->
	<p class="deferred-note">Changes to profile and preferences take effect on your next plan.</p>

	<!-- ═══ Sign Out ═══ -->
	<button class="signout-btn" onclick={signOut}>
		<LogOut size={16} strokeWidth={2} />
		Sign Out
	</button>
</div>

<style>
	/* ═══ Page ═══ */
	.settings-page {
		min-height: 100vh;
		min-height: 100dvh;
		padding: var(--page-pad-top) var(--page-gutter) var(--page-pad-bottom);
		max-width: var(--page-max-width);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* ═══ Header ═══ */
	.settings-header {
		margin-bottom: var(--space-2);
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
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		flex-shrink: 0;
		-webkit-tap-highlight-color: transparent;
	}

	.back-btn:hover {
		border-color: var(--color-border-strong);
		color: var(--color-text);
	}

	.header-title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--color-text);
	}

	.header-slot {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}

	/* ═══ Account Header ═══ */
	.account-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.account-avatar {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
		overflow: hidden;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.account-avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.account-initials {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-text-secondary);
	}

	.account-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.account-name {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.account-email {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ═══ Section Labels ═══ */
	.section-label {
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		font-weight: var(--weight-bold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-tertiary);
		padding: var(--space-1) 0;
	}

	/* ═══ Form Cards ═══ */
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
		gap: var(--space-3);
	}

	.card-title {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.card-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-hint {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.sub-label {
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
		margin-top: var(--space-2);
	}

	.check-in-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-3);
	}

	.check-in-label {
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.check-in-select {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: var(--text-base);
		outline: none;
		transition: border-color var(--duration-normal) var(--ease-out);
		-webkit-appearance: none;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a49b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right var(--space-3) center;
		padding-right: var(--space-8);
	}

	.check-in-select:focus {
		border-color: var(--color-activity);
	}

	/* ═══ Field Groups ═══ */
	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.field-label {
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
	}

	/* ═══ Form Inputs ═══ */
	.form-input {
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

	.form-input:focus {
		border-color: var(--color-activity);
	}

	/* ═══ Chips (shared pattern) ═══ */
	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.chip-column {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.chip {
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
		text-align: left;
		-webkit-tap-highlight-color: transparent;
	}

	.chip:hover {
		border-color: var(--color-border-strong);
	}

	.chip.selected {
		background: var(--color-activity-muted);
		border-color: var(--color-activity);
		color: var(--color-activity);
		font-weight: var(--weight-semibold);
	}

	/* ═══ Day Picker ═══ */
	.day-picker {
		display: flex;
		gap: var(--space-1);
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
		background: var(--color-activity-muted);
		border-color: var(--color-activity);
		color: var(--color-activity);
		font-weight: var(--weight-semibold);
	}

	/* ═══ Duration Chips ═══ */
	.duration-chips {
		display: flex;
		gap: var(--space-1);
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
		background: var(--color-activity-muted);
		border-color: var(--color-activity);
		color: var(--color-activity);
		font-weight: var(--weight-semibold);
	}

	/* ═══ Injury Tags ═══ */
	.injury-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
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
		border-color: var(--color-activity);
		color: var(--color-activity);
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
		background: var(--color-activity-muted);
		border-color: var(--color-activity);
		color: var(--color-activity);
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

	/* ═══ Unit Toggle ═══ */
	.unit-toggle {
		display: flex;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		padding: 3px;
		gap: 2px;
	}

	.unit-btn {
		flex: 1;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-full);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.unit-btn.selected {
		background: var(--color-activity);
		color: var(--color-text-inverse);
		font-weight: var(--weight-semibold);
	}

	/* ═══ Deferred Note ═══ */
	.deferred-note {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		text-align: center;
		line-height: var(--leading-normal);
		padding: var(--space-1) 0;
	}

	/* ═══ Sign Out ═══ */
	.signout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		background: none;
		border: 1.5px solid var(--color-danger);
		border-radius: var(--radius);
		color: var(--color-danger);
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
		margin-top: var(--space-2);
	}

	.signout-btn:hover {
		background: var(--color-danger-muted);
	}
</style>
