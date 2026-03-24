<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
		class?: string;
	}

	let { size = 48, color = 'currentColor', class: className = '' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 48 48"
	fill="none"
	class={className}
	aria-hidden="true"
>
	<rect x="4" y="18" width="40" height="12" rx="3" fill={color} opacity="0.15" />
	<rect x="10" y="12" width="6" height="24" rx="2" fill={color} />
	<rect x="32" y="12" width="6" height="24" rx="2" fill={color} />
	<rect x="16" y="20" width="16" height="8" rx="1.5" fill={color} />
	<rect x="6" y="16" width="10" height="4" rx="1.5" fill={color} opacity="0.6" />
	<rect x="32" y="16" width="10" height="4" rx="1.5" fill={color} opacity="0.6" />
	<rect x="6" y="28" width="10" height="4" rx="1.5" fill={color} opacity="0.6" />
	<rect x="32" y="28" width="10" height="4" rx="1.5" fill={color} opacity="0.6" />
</svg>
