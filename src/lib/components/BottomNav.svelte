<script lang="ts">
	import { page } from '$app/stores';
	import { Dumbbell, ChartNoAxesCombined } from 'lucide-svelte';

	let currentPath = $derived($page.url.pathname);

	const tabs = [
		{ href: '/workout', label: 'Workout', icon: Dumbbell },
		{ href: '/progress', label: 'Progress', icon: ChartNoAxesCombined }
	] as const;

	function isActive(href: string, path: string): boolean {
		return path.startsWith(href);
	}
</script>

<nav class="bottom-nav" aria-label="Main navigation">
	{#each tabs as tab}
		<a
			href={tab.href}
			class="bottom-nav-tab"
			class:active={isActive(tab.href, currentPath)}
			aria-current={isActive(tab.href, currentPath) ? 'page' : undefined}
		>
			<tab.icon size={20} />
			<span class="bottom-nav-label">{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		gap: var(--space-2);
		height: 56px;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		background: var(--color-bg-raised);
		border-top: 1px solid var(--color-border-subtle);
		z-index: var(--z-sticky);
	}

	.bottom-nav-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		flex: 1;
		max-width: 120px;
		padding: var(--space-1) var(--space-2);
		color: var(--color-text-tertiary);
		text-decoration: none;
		font-family: var(--font-body);
		font-size: var(--text-2xs);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		transition: color var(--duration-normal) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.bottom-nav-tab.active {
		color: var(--color-activity);
	}

	.bottom-nav-label {
		line-height: 1;
	}
</style>
