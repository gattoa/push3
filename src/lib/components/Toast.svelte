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
				in:fly={{ y: 20, duration: 200 }}
				out:fly={{ y: 20, duration: 150 }}
			>
				{toast.message}
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: calc(var(--safe-bottom, 0px) + var(--space-4));
		left: var(--page-gutter);
		right: var(--page-gutter);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column-reverse;
		align-items: center;
		gap: var(--space-2);
		pointer-events: none;
	}

	.toast {
		max-width: var(--page-max-width);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-align: left;
		pointer-events: auto;
		background: var(--color-surface);
		color: var(--color-text);
		border-left: 3px solid;
		box-shadow: var(--shadow-lg);
	}

	.toast-error {
		border-left-color: var(--color-danger);
	}

	.toast-success {
		border-left-color: var(--color-activity);
	}
</style>
