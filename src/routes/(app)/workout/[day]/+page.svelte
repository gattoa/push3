<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import WorkoutSession from '$lib/components/WorkoutSession.svelte';
	import { navigating } from '$app/stores';
	import type { FullPlanDay } from '$lib/types/database';

	let { data } = $props();
	let day = $state<FullPlanDay>(data.day as FullPlanDay);
	$effect(() => { day = data.day as FullPlanDay; });
	const unitPref = $derived(data.unitPref as string);
	const exerciseHistory = $derived(data.exerciseHistory as Record<string, { lastWeight: number; lastReps: number; bestE1RM: number }>);

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	let editMode = $state(false);

	// Skip pushUp animation on client-side navigation
	let isClientNav = $state(false);
	$effect(() => {
		if ($navigating) isClientNav = true;
	});
</script>

<svelte:head>
	<title>Push — {DAY_NAMES[day.day_index]} Workout</title>
</svelte:head>

<div class="page">
	<header class="header" class:push-up={!isClientNav} style="--d:0">
		<div class="header-bar">
			{#if editMode}
				<div class="header-slot"></div>
			{:else}
				<a href="/plan" class="back-btn" title="Back to week">
					<ArrowLeft size={18} strokeWidth={2} />
				</a>
			{/if}
			{#if editMode}
				<span class="edit-mode-title">Reorder Exercises</span>
			{:else}
				<SegmentedControl active="week" />
			{/if}
			{#if editMode}
				<button class="edit-btn active" onclick={() => editMode = false}>Done</button>
			{:else if day.exercises.length > 1}
				<button class="edit-btn" onclick={() => editMode = true}>Edit</button>
			{:else}
				<div class="header-slot"></div>
			{/if}
		</div>
		<div class="header-context">
			<h1 class="header-day">{DAY_NAMES[day.day_index]}</h1>
			{#if editMode}
				<p class="edit-hint">Tap an exercise, then tap another to swap</p>
			{:else}
				<span class="header-split">{day.split_label}</span>
			{/if}
		</div>
	</header>

	<WorkoutSession {day} {unitPref} {exerciseHistory} {editMode} />
</div>

<style>
	@keyframes pushUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.push-up {
		animation: pushUp 0.6s var(--ease-out) both;
		animation-delay: calc(var(--d, 0) * 80ms + 100ms);
	}

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

	.header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.header-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.back-btn {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
		text-decoration: none;
		border-radius: var(--radius);
		transition: color var(--duration-fast);
		flex-shrink: 0;
		-webkit-tap-highlight-color: transparent;
	}

	.back-btn:hover {
		color: var(--color-text);
	}

	.header-slot {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}

	.header-context {
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
</style>
