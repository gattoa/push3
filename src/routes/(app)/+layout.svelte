<script lang="ts">
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	let { children } = $props();
</script>

<div class="app-shell">
	<div class="app-content">
		{#key $page.url.pathname}
			<div in:fade={{ duration: 150 }}>
				{@render children()}
			</div>
		{/key}
	</div>
	<!-- BottomNav hidden until Progress page is designed -->
	<!-- <BottomNav /> -->
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	.app-content {
		flex: 1;
	}
</style>
