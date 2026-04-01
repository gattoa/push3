<script lang="ts">
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import AvatarMenu from '$lib/components/AvatarMenu.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import WorkoutSession from '$lib/components/WorkoutSession.svelte';
	import { Eye } from 'lucide-svelte';
	import { shouldShowBanner, dismissBanner } from '$lib/utils/banner';
	import { navigating } from '$app/stores';
	import type { FullPlanDay } from '$lib/types/database';

	let { data } = $props();
	const day = $derived(data.day as FullPlanDay);
	const dayIndex = $derived(data.dayIndex as number);
	const unitPref = $derived(data.unitPref as string);
	const exerciseHistory = $derived(data.exerciseHistory as Record<string, { lastWeight: number; lastReps: number; bestE1RM: number }>);
	const initialBanner = $derived(data.banner as 'check-in' | 'plan-review' | null);

	const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

	// Skip pushUp animation on client-side navigation
	let isClientNav = $state(false);
	$effect(() => {
		if ($navigating) isClientNav = true;
	});

	// Banner (localStorage-backed persistence)
	let showBanner = $state(true);
	$effect(() => {
		if (initialBanner) showBanner = shouldShowBanner(initialBanner);
	});
	function handleDismiss() {
		if (initialBanner) dismissBanner(initialBanner);
		showBanner = false;
	}
</script>

<svelte:head>
	<title>Push — {DAY_NAMES[dayIndex]} Workout</title>
</svelte:head>

<div class="page">
	<header class="header" class:push-up={!isClientNav} style="--d:0">
		<div class="header-bar">
			<div class="header-slot"></div>
			<SegmentedControl active="today" />
			<AvatarMenu />
		</div>
		<div class="header-context">
			<h1 class="header-day">{DAY_NAMES[dayIndex]}, {todayDate}</h1>
			<span class="header-split">{day.split_label}</span>
		</div>
	</header>

	{#if initialBanner && showBanner}
		<Banner
			type={initialBanner}
			href={initialBanner === 'check-in' ? '/check-in' : '/plan'}
			message={initialBanner === 'check-in' ? 'Time for your weekly check-in' : 'Review your new training plan'}
			ondismiss={handleDismiss}
		>
			{#snippet icon()}
				{#if initialBanner === 'plan-review'}
					<Eye size={16} />
				{/if}
			{/snippet}
		</Banner>
	{/if}

	<WorkoutSession {day} {unitPref} {exerciseHistory} />
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
		position: relative;
		z-index: 10;
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
</style>
