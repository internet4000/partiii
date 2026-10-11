<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	let { open, title, onclose, children, class: className = '' }: {
		class?: string; open: boolean; title: string; onclose: () => void; children: Snippet;
	} = $props();
	let element: HTMLDialogElement;
	$effect(() => {
		if (!element) return;
		if (open && !element.open) {
			element.showModal();
			void tick().then(() => element.querySelector<HTMLElement>('textarea, input, select, button, a[href]')?.focus());
		} else if (!open && element.open) element.close();
	});
</script>

<dialog class={className} bind:this={element} aria-label={title} onclose={() => { if (!element.open) onclose(); }}>
	{@render children()}
</dialog>
