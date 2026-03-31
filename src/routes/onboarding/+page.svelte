<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let step = $state(1);
	const totalSteps = 6;

	// Form state
	let dateOfBirth = $state('');
	let gender = $state('');
	let experienceLevel = $state('');
	let goals = $state('');
	let equipment = $state<string[]>([]);
	let trainingDays = $state<number[]>([]);
	let sessionDuration = $state(60);
	let hasInjuries = $state<boolean | null>(null);
	let injuries = $state('');
	let submitting = $state(false);
	let errorMessage = $state('');

	const genderOptions = [
		{ value: 'male', label: 'Male' },
		{ value: 'female', label: 'Female' },
		{ value: 'prefer_not_to_say', label: 'Prefer not to say' }
	];

	const experienceOptions = [
		{ value: 'beginner', label: 'Beginner', desc: 'Less than 1 year of consistent training' },
		{ value: 'intermediate', label: 'Intermediate', desc: '1–3 years of consistent training' },
		{ value: 'advanced', label: 'Advanced', desc: '3+ years with structured programming' }
	];

	const goalOptions = [
		{ value: 'build_muscle', label: 'Build Muscle', desc: 'Hypertrophy-focused programming' },
		{ value: 'build_strength', label: 'Build Strength', desc: 'Strength-focused with progressive overload' },
		{ value: 'lose_fat', label: 'Lose Fat', desc: 'Higher volume, metabolic conditioning' },
		{ value: 'general_fitness', label: 'General Fitness', desc: 'Balanced strength and conditioning' }
	];

	const equipmentOptions = [
		// Free weights
		'barbell', 'dumbbell', 'ez barbell', 'kettlebell',
		// Stations
		'cable', 'machine', 'smith machine',
		// Furniture
		'bench', 'squat rack', 'pull-up bar',
		// Minimal
		'resistance band'
	];

	function selectAllEquipment() {
		equipment = [...equipmentOptions];
	}

	function deselectAllEquipment() {
		equipment = [];
	}

	let allSelected = $derived(equipment.length === equipmentOptions.length);

	const durationOptions = [30, 45, 60, 75, 90];

	const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	function toggleEquipment(item: string) {
		if (equipment.includes(item)) {
			equipment = equipment.filter((e) => e !== item);
		} else {
			equipment = [...equipment, item];
		}
	}

	function toggleTrainingDay(dayIndex: number) {
		if (trainingDays.includes(dayIndex)) {
			trainingDays = trainingDays.filter((d) => d !== dayIndex);
		} else if (trainingDays.length < 6) {
			trainingDays = [...trainingDays, dayIndex].sort((a, b) => a - b);
		}
	}

	function next() {
		if (step < totalSteps) step++;
	}

	function prev() {
		if (step > 1) step--;
	}

	let canAdvance = $derived(
		step === 1 ? dateOfBirth !== '' && gender !== '' :
		step === 2 ? experienceLevel !== '' :
		step === 3 ? goals !== '' :
		step === 4 ? equipment.length > 0 :
		step === 5 ? trainingDays.length >= 2 :
		step === 6 ? hasInjuries !== null :
		true
	);

	// On the injury step, if user selects "No", the form should submit directly
	let isFinalStep = $derived(step === totalSteps);
	let showSubmit = $derived(isFinalStep);
</script>

<svelte:head>
	<title>Push — Set Up Your Profile</title>
</svelte:head>

<div class="onboarding">
	<div class="progress-bar">
		<div class="progress-fill" style="width: {(step / totalSteps) * 100}%"></div>
	</div>

	<div class="step-indicator">Step {step} of {totalSteps}</div>

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			errorMessage = '';
			return async ({ result, update }) => {
				if (result.type === 'failure') {
					errorMessage = (result.data as Record<string, string>)?.message || 'Something went wrong. Please try again.';
					submitting = false;
				} else {
					await update();
					submitting = false;
				}
			};
		}}
	>
		<!-- Hidden fields to persist all state on submit -->
		<input type="hidden" name="date_of_birth" value={dateOfBirth} />
		<input type="hidden" name="gender" value={gender} />
		<input type="hidden" name="experience_level" value={experienceLevel} />
		<input type="hidden" name="goals" value={goals} />
		{#each equipment as eq}
			<input type="hidden" name="equipment" value={eq} />
		{/each}
		{#each trainingDays as d}
			<input type="hidden" name="training_days" value={d} />
		{/each}
		<input type="hidden" name="session_duration_minutes" value={sessionDuration} />
		<input type="hidden" name="injuries" value={hasInjuries ? injuries : ''} />
		<input type="hidden" name="unit_pref" value="lb" />

		<div class="step-content">
			<!-- Step 1: About You (DOB + Gender) -->
			{#if step === 1}
				<h2>About you</h2>
				<p class="step-desc">This helps your AI coach personalize programming for your age and body.</p>

				<div class="field-group">
					<label class="field-label" for="dob">Date of birth</label>
					<input
						type="date"
						id="dob"
						class="date-input"
						bind:value={dateOfBirth}
						max={new Date().toISOString().split('T')[0]}
					/>
				</div>

				<div class="field-group">
					<span class="field-label" id="gender-label">Gender</span>
					<div class="chip-grid compact" role="group" aria-labelledby="gender-label">
						{#each genderOptions as opt}
							<button
								type="button"
								class="chip wide"
								class:selected={gender === opt.value}
								onclick={() => gender = opt.value}
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Step 2: Experience -->
			{#if step === 2}
				<h2>Your training experience?</h2>
				<p class="step-desc">Determines exercise complexity and volume.</p>
				<div class="option-grid">
					{#each experienceOptions as opt}
						<button
							type="button"
							class="option-card"
							class:selected={experienceLevel === opt.value}
							onclick={() => experienceLevel = opt.value}
						>
							<span class="option-label">{opt.label}</span>
							<span class="option-desc">{opt.desc}</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Step 3: Goals -->
			{#if step === 3}
				<h2>What's your primary goal?</h2>
				<p class="step-desc">This shapes your training split, volume, and intensity.</p>
				<div class="option-grid">
					{#each goalOptions as opt}
						<button
							type="button"
							class="option-card"
							class:selected={goals === opt.value}
							onclick={() => goals = opt.value}
						>
							<span class="option-label">{opt.label}</span>
							<span class="option-desc">{opt.desc}</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Step 4: Equipment -->
			{#if step === 4}
				<h2>Available equipment?</h2>
				<div class="step-desc-row">
					<p class="step-desc">Select everything you have access to.</p>
					<button
						type="button"
						class="select-all-link"
						onclick={() => allSelected ? deselectAllEquipment() : selectAllEquipment()}
					>
						{allSelected ? 'Deselect all' : 'Select all'}
					</button>
				</div>

				<div class="equipment-section">
					<span class="group-label">Free weights</span>
					<div class="chip-grid">
						{#each ['barbell', 'dumbbell', 'ez barbell', 'kettlebell'] as eq}
							<button type="button" class="chip" class:selected={equipment.includes(eq)} onclick={() => toggleEquipment(eq)}>{eq}</button>
						{/each}
					</div>
				</div>

				<div class="equipment-section">
					<span class="group-label">Machines & cables</span>
					<div class="chip-grid">
						{#each ['cable', 'machine', 'smith machine'] as eq}
							<button type="button" class="chip" class:selected={equipment.includes(eq)} onclick={() => toggleEquipment(eq)}>{eq}</button>
						{/each}
					</div>
				</div>

				<div class="equipment-section">
					<span class="group-label">Stations</span>
					<div class="chip-grid">
						{#each ['bench', 'squat rack', 'pull-up bar'] as eq}
							<button type="button" class="chip" class:selected={equipment.includes(eq)} onclick={() => toggleEquipment(eq)}>{eq}</button>
						{/each}
					</div>
				</div>

				<div class="equipment-section">
					<span class="group-label">Other</span>
					<div class="chip-grid">
						{#each ['resistance band'] as eq}
							<button type="button" class="chip" class:selected={equipment.includes(eq)} onclick={() => toggleEquipment(eq)}>{eq}</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Step 5: Training Schedule -->
			{#if step === 5}
				<h2>Training schedule</h2>
				<p class="step-desc">Tap the days you train.</p>

				<div class="schedule-group">
					<span class="field-label" id="days-label">Training days</span>
					<div class="day-picker" role="group" aria-labelledby="days-label">
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
					<span class="day-count">
						{#if trainingDays.length === 0}
							Select at least 2 days
						{:else if trainingDays.length === 1}
							Select 1 more day
						{:else}
							{trainingDays.length} days selected
						{/if}
					</span>
				</div>

				<div class="schedule-group">
					<span class="field-label" id="duration-label">Session duration (minutes)</span>
					<div class="chip-grid compact" role="group" aria-labelledby="duration-label">
						{#each durationOptions as dur}
							<button
								type="button"
								class="chip"
								class:selected={sessionDuration === dur}
								onclick={() => sessionDuration = dur}
							>
								{dur}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Step 6: Injuries (Yes/No gate) -->
			{#if step === 6}
				<h2>Any current injuries?</h2>
				<p class="step-desc">Your AI coach will avoid exercises that stress injured areas.</p>

				<div class="chip-grid compact injury-gate">
					<button
						type="button"
						class="chip wide"
						class:selected={hasInjuries === false}
						onclick={() => { hasInjuries = false; injuries = ''; }}
					>
						No
					</button>
					<button
						type="button"
						class="chip wide"
						class:selected={hasInjuries === true}
						onclick={() => hasInjuries = true}
					>
						Yes
					</button>
				</div>

				{#if hasInjuries}
					<div class="injury-expand">
						<label class="field-label" for="injury-desc">Describe your injuries</label>
						<textarea
							id="injury-desc"
							class="injury-input"
							placeholder="e.g. left shoulder, lower back"
							bind:value={injuries}
							rows="3"
						></textarea>
					</div>
				{/if}
			{/if}
		</div>

		{#if errorMessage}
			<div class="error-banner" role="alert">{errorMessage}</div>
		{/if}

		<!-- Navigation -->
		<div class="nav-buttons">
			{#if step > 1}
				<button type="button" class="btn btn-secondary" onclick={prev}>Back</button>
			{:else}
				<div></div>
			{/if}

			{#if showSubmit}
				<button type="submit" class="btn btn-primary" disabled={!canAdvance || submitting}>
					{#if submitting}
						<span class="spinner"></span>
						Saving...
					{:else}
						Generate My Plan
					{/if}
				</button>
			{:else}
				<button type="button" class="btn btn-primary" disabled={!canAdvance} onclick={next}>
					Continue
				</button>
			{/if}
		</div>
	</form>
</div>

<style>
	.onboarding {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: calc(var(--safe-top) + 1rem) 1.5rem calc(var(--safe-bottom) + 2rem);
		max-width: 480px;
		margin: 0 auto;
	}

	.progress-bar {
		width: 100%;
		height: 3px;
		background: var(--color-border);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.step-indicator {
		font-family: var(--font-display);
		font-size: 0.75rem;
		color: var(--color-text-muted);
		letter-spacing: 0.05em;
		margin-bottom: 2rem;
	}

	.step-content {
		flex: 1;
	}

	h2 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.step-desc {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.field-group {
		margin-bottom: 1.5rem;
	}

	.option-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem 1.25rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
		color: var(--color-text);
		font-family: var(--font-body);
	}

	.option-card:hover {
		border-color: var(--color-text-muted);
		background: var(--color-surface-hover);
	}

	.option-card.selected {
		border-color: var(--color-accent);
		background: rgba(34, 197, 94, 0.08);
	}

	.option-label {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.option-desc {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.step-desc-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.step-desc-row .step-desc {
		margin-bottom: 0;
	}

	.select-all-link {
		background: none;
		border: none;
		color: var(--color-accent);
		font-family: var(--font-body);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.select-all-link:hover {
		text-decoration: underline;
	}

	.equipment-section {
		margin-bottom: 1.25rem;
	}

	.group-label {
		display: block;
		font-family: var(--font-display);
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 0.5rem;
	}

	.chip-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip-grid.compact {
		gap: 0.5rem;
	}

	.chip {
		padding: 0.6rem 1rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.85rem;
		color: var(--color-text);
		transition: all 0.15s ease;
		text-transform: capitalize;
	}

	.chip:hover {
		border-color: var(--color-text-muted);
	}

	.chip.selected {
		border-color: var(--color-accent);
		background: rgba(34, 197, 94, 0.08);
		color: var(--color-accent);
	}

	.chip.wide {
		flex: 1;
		text-align: center;
		min-width: 140px;
	}

	.schedule-group {
		margin-bottom: 1.5rem;
	}

	.day-picker {
		display: flex;
		gap: 0.375rem;
	}

	.day-chip {
		flex: 1;
		padding: 0.625rem 0;
		background: var(--color-surface);
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

	.day-count {
		display: block;
		margin-top: 0.5rem;
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.field-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.date-input {
		width: 100%;
		padding: 0.875rem 1rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.15s ease;
		color-scheme: dark;
	}

	.date-input:focus {
		border-color: var(--color-accent);
	}

	.injury-gate {
		margin-bottom: 1.5rem;
	}

	.injury-expand {
		animation: slideDown 0.2s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.injury-input {
		width: 100%;
		padding: 0.875rem 1rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: 0.9rem;
		resize: vertical;
		outline: none;
		transition: border-color 0.15s ease;
	}

	.injury-input:focus {
		border-color: var(--color-accent);
	}

	.injury-input::placeholder {
		color: var(--color-text-muted);
		opacity: 0.5;
	}

	.nav-buttons {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: var(--color-accent);
		color: #0a0a0a;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-accent-hover);
	}

	.btn-primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
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

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(10, 10, 10, 0.2);
		border-top-color: #0a0a0a;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		line-height: 1.4;
		margin-top: 1rem;
	}
</style>
