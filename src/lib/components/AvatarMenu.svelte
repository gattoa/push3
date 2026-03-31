<script lang="ts">
	import { page } from '$app/state';

	const user = $derived(page.data.user);
	const initials = $derived(
		user?.user_metadata?.full_name
			? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
			: user?.email?.[0]?.toUpperCase() ?? '?'
	);
	const avatarUrl = $derived(user?.user_metadata?.avatar_url ?? null);
</script>

<a class="avatar-link" href="/settings" title="Settings">
	{#if avatarUrl}
		<img src={avatarUrl} alt="Avatar" class="avatar-img" referrerpolicy="no-referrer" />
	{:else}
		<span class="avatar-initials">{initials}</span>
	{/if}
</a>

<style>
	.avatar-link {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		flex-shrink: 0;
		overflow: hidden;
		-webkit-tap-highlight-color: transparent;
		text-decoration: none;
	}

	.avatar-link:hover {
		border-color: var(--color-border-strong);
		color: var(--color-text);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initials {
		font-family: var(--font-display);
		font-size: var(--text-2xs);
		font-weight: var(--weight-bold);
		color: var(--color-text-secondary);
	}
</style>
