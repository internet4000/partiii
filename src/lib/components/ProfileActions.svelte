<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Copy from '@lucide/svelte/icons/copy';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Share2 from '@lucide/svelte/icons/share-2';
	import X from '@lucide/svelte/icons/x';
	import { useApp } from '$lib/app.svelte';
	import { profilePath } from '$lib/records';
	import NativeDialog from './NativeDialog.svelte';
	let { did, handle }: {
		did: string; handle?: string;
	} = $props();
	const app = useApp();
	let open = $state(false);
	let nativeShare = $state(false);
	let notice = $state('');
	function openMenu() {
		nativeShare = typeof navigator.share === 'function';
		notice = ''; open = true;
	}
	async function share() {
		const url = new URL(profilePath(did), location.origin).href;
		if (navigator.share) {
			try { await navigator.share({ title: `${handle ?? did} · partiii`, url }); open = false; return; }
			catch (cause) { if (cause instanceof DOMException && cause.name === 'AbortError') return; }
		}
		try { await navigator.clipboard.writeText(url); notice = app.msg.copied; }
		catch { notice = url; }
	}
</script>

<button type="button" class="post-actions" aria-label={app.msg.profileMenu} aria-haspopup="dialog" onclick={openMenu}><Ellipsis aria-hidden="true" /></button>
<NativeDialog {open} title={app.msg.profileMenu} class="menu-dialog" onclose={() => open = false}>
	<header class="dialog-heading"><h2>{app.msg.profileMenu}</h2><form method="dialog"><button aria-label={app.msg.close}><X aria-hidden="true" /></button></form></header>
	<div class="stack">
		<a href={`https://bsky.app/profile/${encodeURIComponent(did)}`} onclick={() => open = false}><ArrowUpRight aria-hidden="true" />{app.msg.visitBlueskyProfile}</a>
		<button type="button" onclick={share}>{#if nativeShare}<Share2 aria-hidden="true" />{app.msg.shareProfile}{:else}<Copy aria-hidden="true" />{app.msg.copyProfileLink}{/if}</button>
		{#if notice}<p class="muted" role="status">{notice}</p>{/if}
	</div>
</NativeDialog>
