<script lang="ts">
	import { ClipboardCheck, ChevronRight, X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		type: 'plan-review' | 'check-in';
		href: string;
		message: string;
		ondismiss: () => void;
		icon?: Snippet;
	}

	let { type, href, message, ondismiss, icon }: Props = $props();
</script>

<div class="banner banner-{type}" role="status">
	<a {href} class="banner-body">
		<span class="banner-icon">
			{#if icon}
				{@render icon()}
			{:else}
				<ClipboardCheck size={16} />
			{/if}
		</span>
		<span class="banner-text">{message}</span>
		<ChevronRight size={14} class="banner-arrow" />
	</a>
	<button
		class="banner-dismiss"
		onclick={(e: MouseEvent) => { e.stopPropagation(); ondismiss(); }}
		title="Dismiss"
		aria-label="Dismiss banner"
	>
		<X size={14} />
	</button>
</div>

<style>
	.banner {
		display: flex;
		align-items: stretch;
		background: var(--color-surface);
		border-radius: var(--radius);
		overflow: hidden;
		text-decoration: none;
		color: var(--color-text);
		box-shadow: var(--shadow-sm);
		animation: slideIn 0.4s var(--ease-out) both;
		animation-delay: 200ms;
	}

	.banner-check-in {
		background: var(--color-reflect-muted);
	}

	.banner-plan-review {
		background: var(--color-activity-muted);
	}

	.banner-body {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		text-decoration: none;
		color: inherit;
		transition: opacity var(--duration-normal) var(--ease-out);
	}

	.banner-body:hover {
		opacity: 0.85;
	}

	.banner-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.banner-check-in .banner-icon {
		color: var(--color-reflect);
	}

	.banner-plan-review .banner-icon {
		color: var(--color-activity);
	}

	.banner-text {
		flex: 1;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	:global(.banner-arrow) {
		color: var(--color-text-tertiary);
		flex-shrink: 0;
	}

	.banner-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 var(--space-3);
		background: none;
		border: none;
		border-left: 1px solid var(--color-border-subtle);
		color: var(--color-text-tertiary);
		cursor: pointer;
		transition: color var(--duration-fast);
	}

	.banner-dismiss:hover {
		color: var(--color-text-secondary);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
