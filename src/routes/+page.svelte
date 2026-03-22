<script lang="ts">
	let { data } = $props();
	let loading = $state(false);

	// Auth guard in hooks.server.ts handles redirecting authenticated users
	// to /onboarding or /plan based on onboarding status

	async function signInWithGoogle() {
		loading = true;
		const { error } = await data.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});
		if (error) {
			console.error('Auth error:', error.message);
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Push — Log Your Lifts</title>
	<meta name="description" content="The fastest way to track your workouts." />
</svelte:head>

<div class="login-page">
	<!-- Ambient glow -->
	<div class="glow"></div>
	<div class="glow glow--secondary"></div>

	<!-- Grid lines background texture -->
	<div class="grid-lines"></div>

	<main class="login-content">
		<!-- Barbell icon mark -->
		<div class="logo-mark">
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
				<rect x="4" y="18" width="40" height="12" rx="3" fill="var(--color-accent)" opacity="0.15"/>
				<rect x="10" y="12" width="6" height="24" rx="2" fill="var(--color-accent)"/>
				<rect x="32" y="12" width="6" height="24" rx="2" fill="var(--color-accent)"/>
				<rect x="16" y="20" width="16" height="8" rx="1.5" fill="var(--color-accent)"/>
				<rect x="6" y="16" width="10" height="4" rx="1.5" fill="var(--color-accent)" opacity="0.6"/>
				<rect x="32" y="16" width="10" height="4" rx="1.5" fill="var(--color-accent)" opacity="0.6"/>
				<rect x="6" y="28" width="10" height="4" rx="1.5" fill="var(--color-accent)" opacity="0.6"/>
				<rect x="32" y="28" width="10" height="4" rx="1.5" fill="var(--color-accent)" opacity="0.6"/>
			</svg>
		</div>

		<h1 class="title">
			<span class="title-letter" style="--i: 0">p</span><span class="title-letter" style="--i: 1">u</span><span class="title-letter" style="--i: 2">s</span><span class="title-letter" style="--i: 3">h</span>
		</h1>

		<p class="tagline">Log your lifts. Track your progress.<br/>Built for the gym floor.</p>

		<button
			class="google-btn"
			onclick={signInWithGoogle}
			disabled={loading}
		>
			{#if loading}
				<span class="spinner"></span>
				Connecting...
			{:else}
				<svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
				</svg>
				Sign in with Google
			{/if}
		</button>

		<p class="footer-text">Free to use. No credit card required.</p>
	</main>

	<span class="version">v0.1.0</span>
</div>

<style>
	.login-page {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		min-height: 100dvh;
		overflow: hidden;
		background: var(--color-bg);
		padding-top: var(--safe-top);
		padding-bottom: var(--safe-bottom);
	}

	/* Ambient glow effects */
	.glow {
		position: absolute;
		width: 600px;
		height: 600px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%);
		top: -200px;
		right: -100px;
		pointer-events: none;
		animation: drift 20s ease-in-out infinite;
	}

	.glow--secondary {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(34, 197, 94, 0.05) 0%, transparent 70%);
		top: auto;
		bottom: -150px;
		left: -100px;
		right: auto;
		animation-delay: -10s;
		animation-direction: reverse;
	}

	@keyframes drift {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(30px, -20px) scale(1.05); }
		66% { transform: translate(-20px, 15px) scale(0.95); }
	}

	/* Subtle grid texture */
	.grid-lines {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
		background-size: 60px 60px;
		pointer-events: none;
		mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%);
	}

	.login-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		text-align: center;
		animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		opacity: 0;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.logo-mark {
		margin-bottom: 1.5rem;
		animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
		opacity: 0;
	}

	.title {
		font-family: var(--font-display);
		font-size: clamp(4.5rem, 15vw, 8rem);
		font-weight: 800;
		letter-spacing: 0.15em;
		line-height: 1;
		margin-bottom: 1rem;
		color: var(--color-text);
		display: flex;
		gap: 0.02em;
	}

	.title-letter {
		display: inline-block;
		animation: letterReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) calc(0.15s + var(--i) * 0.06s) forwards;
		opacity: 0;
		transform: translateY(30px);
	}

	@keyframes letterReveal {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.tagline {
		font-family: var(--font-body);
		font-size: 1.05rem;
		font-weight: 400;
		color: var(--color-text-muted);
		line-height: 1.6;
		margin-bottom: 2.5rem;
		max-width: 280px;
		animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
		opacity: 0;
	}

	.google-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.875rem 2rem;
		width: 100%;
		max-width: 300px;
		background: var(--color-text);
		color: #0a0a0a;
		border: none;
		border-radius: var(--radius);
		font-family: var(--font-body);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.65s forwards;
		opacity: 0;
		position: relative;
		overflow: hidden;
	}

	.google-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, transparent 40%, rgba(34, 197, 94, 0.15));
		opacity: 0;
		transition: opacity 0.3s;
	}

	.google-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 8px 30px rgba(34, 197, 94, 0.15),
			0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.google-btn:hover:not(:disabled)::before {
		opacity: 1;
	}

	.google-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.google-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.google-icon {
		flex-shrink: 0;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(10, 10, 10, 0.2);
		border-top-color: #0a0a0a;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.footer-text {
		font-family: var(--font-body);
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 1.25rem;
		animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
		opacity: 0;
	}

	.version {
		position: fixed;
		bottom: 1.25rem;
		right: 1.5rem;
		font-family: var(--font-display);
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-muted);
		opacity: 0.25;
		letter-spacing: 0.05em;
	}

	@media (max-width: 480px) {
		.login-content {
			padding: 1.5rem;
		}

		.tagline {
			font-size: 0.95rem;
		}

		.google-btn {
			max-width: 100%;
		}
	}
</style>
