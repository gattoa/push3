let toasts = $state<Array<{ id: number; message: string; type: 'error' | 'success' }>>([]);
let nextId = 0;

export function addToast(message: string, type: 'error' | 'success' = 'error'): void {
	const id = nextId++;
	toasts.push({ id, message, type });
	setTimeout(() => {
		toasts = toasts.filter((t) => t.id !== id);
	}, 4000);
}

export function getToasts() {
	return toasts;
}
