<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	let { open, title, onclose, children, dismissible = true, class: className = '' }: {
		class?: string; open: boolean; title: string; onclose: () => void; children: Snippet; dismissible?: boolean;
	} = $props();
	let element: HTMLDialogElement;
	$effect(() => {
		if (!element) return;
		if (open && !element.open) {
			element.showModal();
			void tick().then(() => {
				if (!element.open) return;
				(element.querySelector<HTMLElement>('[data-dialog-focus]') ?? element.querySelector<HTMLElement>('textarea, input, select') ?? element.querySelector<HTMLElement>('button, a[href]'))?.focus();
			});
		} else if (!open && element.open) element.close();
	});
</script>

<dialog class={className} bind:this={element} aria-label={title} onclick={(event) => { if (dismissible && event.target === element) element.close(); }} oncancel={(event) => { if (!dismissible) event.preventDefault(); }} onclose={() => { if (!element.open) onclose(); }}>
	{@render children()}
</dialog>
