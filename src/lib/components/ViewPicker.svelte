<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import List from '@lucide/svelte/icons/list';
	import Map from '@lucide/svelte/icons/map';
	import X from '@lucide/svelte/icons/x';
	import { useApp } from '$lib/app.svelte';
	import NativeDialog from './NativeDialog.svelte';

	let { view, onchoose }: {
		view: 'list' | 'grid' | 'map';
		onchoose: (value: 'list' | 'grid' | 'map') => Promise<void>;
	} = $props();
	const app = useApp();
	const views = [{ value: 'list', icon: List }, { value: 'grid', icon: LayoutGrid }, { value: 'map', icon: Map }] as const;
	let open = $state(false);
	async function choose(value: 'list' | 'grid' | 'map') {
		await onchoose(value);
		open = false;
	}
</script>

<button type="button" class="view-button" aria-label={`${app.msg.view}: ${app.msg[view]}`} title={`${app.msg.view}: ${app.msg[view]}`} aria-haspopup="dialog" onclick={() => open = true}>
	{#if view === 'grid'}<LayoutGrid aria-hidden="true" />{:else if view === 'map'}<Map aria-hidden="true" />{:else}<List aria-hidden="true" />{/if}
</button>

<NativeDialog {open} title={app.msg.view} class="menu-dialog" onclose={() => open = false}>
	<header class="dialog-heading"><h2>{app.msg.view}</h2><form method="dialog"><button aria-label={app.msg.close}><X aria-hidden="true" /></button></form></header>
	<div class="stack">{#each views as option (option.value)}<button type="button" class="view-option" aria-pressed={view === option.value} data-dialog-focus={view === option.value || undefined} onclick={() => choose(option.value)}><option.icon aria-hidden="true" /><span>{app.msg[option.value]}</span>{#if view === option.value}<Check aria-hidden="true" />{/if}</button>{/each}</div>
</NativeDialog>
