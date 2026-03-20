<script lang="ts">
	import type { UserSettings } from '$lib/types/database';

	let { data, form } = $props();
	const plan = data.plan;
	const settings: UserSettings = data.settings;
	const weekStats = data.weekStats;

	// Pre-fill from current settings
	let bodyWeight = $state('');
	let injuries = $state(settings.injuries.join(', '));
	let equipment = $state(settings.equipment.join(', '));
	let injuryChanges = $state('');
	let equipmentChanges = $state('');
	let notes = $state('');

	let submitting = $state(false);

	const completionRate = weekStats.totalSets > 0
		? Math.round((weekStats.completedSets / weekStats.totalSets) * 100)
		: 0;
</script>

<svelte:head>
	<title>Push — Week {plan.week_number} Check-In</title>
</svelte:head>

<div class="checkin-page">
	<header class="checkin-header">
		<a href="/plan" class="back-link">&larr; Back</a>
		<h1>Week {plan.week_number} Check-In</h1>
	</header>

	<!-- Week Summary -->
	<div class="week-summary">
		<h2>Your Week</h2>
		<div class="stats-grid">
			<div class="stat-card">
				<span class="stat-value">{weekStats.daysWorkedOut}</span>
				<span class="stat-label">Days Trained</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{completionRate}%</span>
				<span class="stat-label">Sets Completed</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{weekStats.totalVolume.toLocaleString()}</span>
				<span class="stat-label">Volume ({settings.unit_pref})</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{weekStats.skippedSets}</span>
				<span class="stat-label">Sets Skipped</span>
			</div>
		</div>
	</div>

	{#if form?.error}
		<div class="error-banner">{form.error}</div>
	{/if}

	<form method="POST" class="checkin-form" onsubmit={() => { submitting = true; }}>
		<input type="hidden" name="week_number" value={plan.week_number} />
		<input type="hidden" name="injuries" value={injuries} />
		<input type="hidden" name="equipment" value={equipment} />

		<!-- Body Weight -->
		<div class="form-section">
			<label for="body_weight" class="form-label">Body Weight ({settings.unit_pref})</label>
			<p class="form-hint">Optional — used for tracking trends.</p>
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
		</div>

		<!-- Injuries -->
		<div class="form-section">
			<label class="form-label">Current Injuries</label>
			<p class="form-hint">Update if anything has changed. Comma-separated.</p>
			<input
				type="text"
				placeholder={settings.injuries.length > 0 ? settings.injuries.join(', ') : 'None'}
				bind:value={injuries}
				class="form-input"
			/>

			<label for="injury_changes" class="form-label sub-label">What changed?</label>
			<textarea
				id="injury_changes"
				name="injury_changes"
				placeholder="e.g. Left knee feeling better, new shoulder tightness"
				bind:value={injuryChanges}
				rows="2"
				class="form-textarea"
			></textarea>
		</div>

		<!-- Equipment -->
		<div class="form-section">
			<label class="form-label">Available Equipment</label>
			<p class="form-hint">Update if your equipment access has changed. Comma-separated.</p>
			<input
				type="text"
				placeholder={settings.equipment.join(', ')}
				bind:value={equipment}
				class="form-input"
			/>

			<label for="equipment_changes" class="form-label sub-label">What changed?</label>
			<textarea
				id="equipment_changes"
				name="equipment_changes"
				placeholder="e.g. Got a pull-up bar, lost access to cable machine"
				bind:value={equipmentChanges}
				rows="2"
				class="form-textarea"
			></textarea>
		</div>

		<!-- Notes -->
		<div class="form-section">
			<label for="notes" class="form-label">Notes for Next Week</label>
			<p class="form-hint">Anything your AI coach should know? Preferences, schedule changes, etc.</p>
			<textarea
				id="notes"
				name="notes"
				placeholder="e.g. Traveling next Thursday, prefer heavier legs this week"
				bind:value={notes}
				rows="3"
				class="form-textarea"
			></textarea>
		</div>

		<button type="submit" class="btn btn-primary" disabled={submitting}>
			{submitting ? 'Generating next week...' : 'Submit & Generate Week ' + (plan.week_number + 1)}
		</button>
	</form>
</div>

<style>
	.checkin-page {
		min-height: 100vh;
		min-height: 100dvh;
		padding: 1rem 1rem 4rem;
		max-width: 480px;
		margin: 0 auto;
	}

	.checkin-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.back-link {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: var(--color-text);
	}

	.checkin-header h1 {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 700;
	}

	/* Week summary */
	.week-summary {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.week-summary h2 {
		font-family: var(--font-display);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.5rem;
		background: var(--color-bg);
		border-radius: var(--radius-sm);
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
	}

	.stat-label {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Error */
	.error-banner {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		padding: 0.75rem;
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}

	/* Form */
	.checkin-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-label {
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.form-label.sub-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.5rem;
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-bottom: 0.25rem;
	}

	.form-input,
	.form-textarea {
		width: 100%;
		padding: 0.65rem 0.75rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-family: var(--font-body);
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.15s ease;
	}

	.form-input:focus,
	.form-textarea:focus {
		border-color: var(--color-accent);
	}

	.form-input::placeholder,
	.form-textarea::placeholder {
		color: var(--color-text-muted);
		opacity: 0.5;
	}

	.form-textarea {
		resize: vertical;
		min-height: 60px;
	}

	/* Hide number spinners */
	.form-input[type="number"]::-webkit-outer-spin-button,
	.form-input[type="number"]::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.form-input[type="number"] {
		-moz-appearance: textfield;
	}

	/* Submit */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.85rem 1.5rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
		margin-top: 0.5rem;
	}

	.btn-primary {
		background: var(--color-accent);
		color: #0a0a0a;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-accent-hover);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
