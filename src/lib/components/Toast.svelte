<script lang="ts">
	import { getToasts } from '$lib/stores/toast.svelte';
	import { fly } from 'svelte/transition';

	const toasts = $derived(getToasts());
</script>

{#if toasts.length > 0}
	<div class="toast-container">
		{#each toasts as toast (toast.id)}
			<div
				class="toast toast-{toast.type}"
				in:fly={{ y: -20, duration: 200 }}
				out:fly={{ y: -20, duration: 150 }}
			>
				{toast.message}
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		top: calc(var(--safe-top, 0px) + var(--space-3));
		left: var(--page-gutter);
		right: var(--page-gutter);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		pointer-events: none;
	}

	.toast {
		max-width: var(--page-max-width);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-align: center;
		pointer-events: auto;
	}

	.toast-error {
		background: var(--color-danger-muted);
		color: var(--color-danger);
		border: 1px solid var(--color-danger);
	}

	.toast-success {
		background: var(--color-activity-muted);
		color: var(--color-activity);
		border: 1px solid var(--color-activity);
	}
</style>
