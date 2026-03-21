<script lang="ts">
	import { page } from '$app/state';

	const reason = $derived(page.url.searchParams.get('reason') || 'Something went wrong during sign-in.');
</script>

<svelte:head>
	<title>Push — Sign-In Error</title>
</svelte:head>

<div class="error-page">
	<div class="error-card">
		<div class="error-icon">!</div>
		<h1>Sign-in failed</h1>
		<p class="reason">{reason}</p>
		<a href="/" class="btn btn-primary">Back to Sign In</a>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: var(--color-bg);
	}

	.error-card {
		text-align: center;
		max-width: 360px;
	}

	.error-icon {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 3px solid #ef4444;
		color: #ef4444;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
	}

	h1 {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	.reason {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1.5;
		margin-bottom: 2rem;
	}

	.btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		text-decoration: none;
	}

	.btn-primary {
		background: var(--color-accent);
		color: #0a0a0a;
	}

	.btn-primary:hover {
		filter: brightness(1.1);
	}
</style>
