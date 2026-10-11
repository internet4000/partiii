<script lang="ts">
	import { tick } from 'svelte';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import { useApp } from '$lib/app.svelte';
	import ViewPicker from './ViewPicker.svelte';

	let { query, view, onsearch, onviewchange }: {
		query: string; view?: 'list' | 'grid' | 'map';
		onsearch: (value: string) => Promise<void>;
		onviewchange?: (value: 'list' | 'grid' | 'map') => Promise<void>;
	} = $props();
	const app = useApp();
	let draft = $derived(query);
	let input: HTMLInputElement;
	async function clear() {
		draft = '';
		await onsearch('');
		await tick();
		input.focus();
	}
</script>

<div class="search-toolbar section-padding">
	<form class="search-form" role="search" onsubmit={(event) => { event.preventDefault(); void onsearch(draft.trim()); }}>
		<div class="search-field">
			<input type="search" name="q" bind:this={input} bind:value={draft} aria-label={app.msg.search} placeholder={app.msg.searchPlaceholder} />
			{#if draft || query}<button type="button" class="clear-search" aria-label={app.msg.clearSearch} title={app.msg.clearSearch} onclick={clear}><X aria-hidden="true" /></button>{/if}
		</div>
		<button type="submit" aria-label={app.msg.search} title={app.msg.search}><Search aria-hidden="true" /></button>
	</form>
	{#if view && onviewchange}<ViewPicker {view} onchoose={onviewchange} />{/if}
</div>
