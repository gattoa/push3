<script lang="ts">
	import { enhance } from '$app/forms';

	let step = $state(1);
	const totalSteps = 6;

	// Form state
	let goals = $state('');
	let experienceLevel = $state('');
	let equipment = $state<string[]>([]);
	let trainingDays = $state(4);
	let sessionDuration = $state(60);
	let injuries = $state('');
	let unitPref = $state<'lb' | 'kg'>('lb');
	let submitting = $state(false);

	const goalOptions = [
		{ value: 'build_muscle', label: 'Build Muscle', desc: 'Hypertrophy-focused programming' },
		{ value: 'build_strength', label: 'Build Strength', desc: 'Strength-focused with progressive overload' },
		{ value: 'lose_fat', label: 'Lose Fat', desc: 'Higher volume, metabolic conditioning' },
		{ value: 'general_fitness', label: 'General Fitness', desc: 'Balanced strength and conditioning' }
	];

	const experienceOptions = [
		{ value: 'beginner', label: 'Beginner', desc: 'Less than 1 year of consistent training' },
		{ value: 'intermediate', label: 'Intermediate', desc: '1–3 years of consistent training' },
		{ value: 'advanced', label: 'Advanced', desc: '3+ years with structured programming' }
	];

	const equipmentOptions = [
		'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
		'kettlebell', 'resistance band', 'ez barbell', 'smith machine',
		'pull-up bar', 'bench', 'squat rack'
	];

	const durationOptions = [30, 45, 60, 75, 90];

	function toggleEquipment(item: string) {
		if (equipment.includes(item)) {
			equipment = equipment.filter((e) => e !== item);
		} else {
			equipment = [...equipment, item];
		}
	}

	function next() {
		if (step < totalSteps) step++;
	}

	function prev() {
		if (step > 1) step--;
	}

	let canAdvance = $derived(
		step === 1 ? goals !== '' :
		step === 2 ? experienceLevel !== '' :
		step === 3 ? equipment.length > 0 :
		step === 4 ? true :
		step === 5 ? true :
		true
	);
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
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<!-- Hidden fields to persist all state on submit -->
		<input type="hidden" name="goals" value={goals} />
		<input type="hidden" name="experience_level" value={experienceLevel} />
		{#each equipment as eq}
			<input type="hidden" name="equipment" value={eq} />
		{/each}
		<input type="hidden" name="training_days_per_week" value={trainingDays} />
		<input type="hidden" name="session_duration_minutes" value={sessionDuration} />
		<input type="hidden" name="injuries" value={injuries} />
		<input type="hidden" name="unit_pref" value={unitPref} />

		<div class="step-content">
			<!-- Step 1: Goals -->
			{#if step === 1}
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

			<!-- Step 3: Equipment -->
			{#if step === 3}
				<h2>Available equipment?</h2>
				<p class="step-desc">Select everything you have access to.</p>
				<div class="chip-grid">
					{#each equipmentOptions as eq}
						<button
							type="button"
							class="chip"
							class:selected={equipment.includes(eq)}
							onclick={() => toggleEquipment(eq)}
						>
							{eq}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Step 4: Training Days + Duration -->
			{#if step === 4}
				<h2>Training schedule</h2>
				<p class="step-desc">How many days per week and how long per session?</p>

				<div class="schedule-group">
					<label class="field-label">Days per week</label>
					<div class="chip-grid compact">
						{#each [2, 3, 4, 5, 6] as d}
							<button
								type="button"
								class="chip"
								class:selected={trainingDays === d}
								onclick={() => trainingDays = d}
							>
								{d}
							</button>
						{/each}
					</div>
				</div>

				<div class="schedule-group">
					<label class="field-label">Session duration (minutes)</label>
					<div class="chip-grid compact">
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

			<!-- Step 5: Unit preference -->
			{#if step === 5}
				<h2>Weight unit preference</h2>
				<p class="step-desc">Used for target weights in your plans.</p>
				<div class="chip-grid compact">
					<button
						type="button"
						class="chip wide"
						class:selected={unitPref === 'lb'}
						onclick={() => unitPref = 'lb'}
					>
						Pounds (lb)
					</button>
					<button
						type="button"
						class="chip wide"
						class:selected={unitPref === 'kg'}
						onclick={() => unitPref = 'kg'}
					>
						Kilograms (kg)
					</button>
				</div>
			{/if}

			<!-- Step 6: Injuries -->
			{#if step === 6}
				<h2>Any current injuries?</h2>
				<p class="step-desc">Optional. Comma-separated (e.g. "left shoulder, lower back"). Leave blank if none.</p>
				<textarea
					class="injury-input"
					placeholder="e.g. left shoulder, lower back"
					bind:value={injuries}
					rows="3"
				></textarea>
			{/if}
		</div>

		<!-- Navigation -->
		<div class="nav-buttons">
			{#if step > 1}
				<button type="button" class="btn btn-secondary" onclick={prev}>Back</button>
			{:else}
				<div></div>
			{/if}

			{#if step < totalSteps}
				<button type="button" class="btn btn-primary" disabled={!canAdvance} onclick={next}>
					Continue
				</button>
			{:else}
				<button type="submit" class="btn btn-primary" disabled={submitting}>
					{#if submitting}
						<span class="spinner"></span>
						Saving...
					{:else}
						Generate My Plan
					{/if}
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

	.field-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
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
</style>
