<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let status = $state<'generating' | 'error'>('generating');
	let errorMessage = $state('');

	onMount(async () => {
		try {
			const res = await fetch('/api/generate-plan', { method: 'POST' });
			const data = await res.json();

			if (!res.ok || data.error) {
				status = 'error';
				errorMessage = data.error || 'Generation failed.';
				return;
			}

			goto('/plan');
		} catch (e) {
			status = 'error';
			errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
		}
	});

	function retry() {
		status = 'generating';
		errorMessage = '';
		// Re-trigger by remounting
		goto('/plan/generate', { replaceState: true, invalidateAll: true });
	}
</script>

<svelte:head>
	<title>Push — Generating Your Plan</title>
</svelte:head>

<div class="generate-page">
	{#if status === 'generating'}
		<div class="loading">
			<div class="pulse-ring"></div>
			<h2>Building your plan...</h2>
			<p class="subtitle">This takes 10-20 seconds. Your AI coach is analyzing your profile and selecting exercises.</p>
		</div>
	{:else}
		<div class="error-state">
			<h2>Generation failed</h2>
			<p class="error-msg">{errorMessage}</p>
			<button class="btn btn-primary" onclick={retry}>Try Again</button>
		</div>
	{/if}
</div>

<style>
	.generate-page {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: calc(var(--safe-top) + 2rem) 2rem calc(var(--safe-bottom) + 2rem);
	}

	.loading, .error-state {
		text-align: center;
		max-width: 360px;
	}

	h2 {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.pulse-ring {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 3px solid var(--color-accent);
		animation: pulse 1.5s ease-in-out infinite;
		margin: 0 auto 1.5rem;
	}

	@keyframes pulse {
		0% { transform: scale(0.8); opacity: 1; }
		50% { transform: scale(1.2); opacity: 0.4; }
		100% { transform: scale(0.8); opacity: 1; }
	}

	.error-msg {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
	}

	.btn-primary {
		background: var(--color-accent);
		color: #0a0a0a;
	}

	.btn-primary:hover {
		background: var(--color-accent-hover);
	}
</style>
