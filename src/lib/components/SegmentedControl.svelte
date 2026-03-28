<script lang="ts">
	let { active = 'today' }: { active: 'today' | 'week' } = $props();
</script>

<div class="segment-container">
	<a
		href="/plan"
		class="segment"
		class:active={active === 'week'}
		aria-current={active === 'week' ? 'page' : undefined}
	>Week</a>
	<a
		href="/workout"
		class="segment"
		class:active={active === 'today'}
		aria-current={active === 'today' ? 'page' : undefined}
	>Today</a>
</div>

<style>
	.segment-container {
		display: flex;
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		padding: 3px;
		gap: 2px;
	}

	.segment {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 56px;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text-secondary);
		text-decoration: none;
		background: transparent;
		transition: background var(--duration-normal) var(--ease-out),
			color var(--duration-normal) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.segment:hover:not(.active) {
		color: var(--color-text);
	}

	.segment.active {
		background: var(--color-activity);
		color: var(--color-text-inverse);
		font-weight: var(--weight-semibold);
	}
</style>
