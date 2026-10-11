<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MapPinX from '@lucide/svelte/icons/map-pin-x';
	import Send from '@lucide/svelte/icons/send';
	import X from '@lucide/svelte/icons/x';
	import { useApp } from '$lib/app.svelte';
	import type { Place } from '$lib/atproto';
	import NativeDialog from './NativeDialog.svelte';
	import PlacePicker from './PlacePicker.svelte';

	let { open, reply = false, onclose, onsubmit }: {
		open: boolean; reply?: boolean; onclose: () => void;
		onsubmit: (text: string, place?: Place) => Promise<void>;
	} = $props();
	const app = useApp();
	let text = $state('');
	let place = $state<Place>();
	let showPlace = $state(false);
	let busy = $state(false);
	let error = $state('');
	const title = $derived(reply ? app.msg.reply : app.msg.prompt);
	const canSubmit = $derived(Boolean(app.account && text.trim() && text.length <= 1000 && !busy));
	function close() {
		showPlace = false;
		onclose();
	}
	async function submit() {
		if (!canSubmit) return;
		busy = true; error = '';
		try {
			await onsubmit(text.trim(), place);
			text = ''; place = undefined;
			close();
		} catch { error = reply ? app.msg.replyError : app.msg.postError; }
		finally { busy = false; }
	}
</script>

<NativeDialog {open} {title} class="composer-dialog" dismissible={!busy} onclose={close}>
	<header class="dialog-heading">
		<h2>{title}</h2>
		<form method="dialog"><button disabled={busy} aria-label={app.msg.close}><X aria-hidden="true" /></button></form>
	</header>
	<form class="stack" aria-busy={busy} onsubmit={(event) => { event.preventDefault(); void submit(); }}>
		<label class="sr-only" for={reply ? 'reply-text' : 'new-post'}>{reply ? app.msg.writeReply : app.msg.write}</label>
		<textarea id={reply ? 'reply-text' : 'new-post'} bind:value={text} maxlength="1000" required dir="auto" disabled={busy} data-dialog-focus
			placeholder={reply ? app.msg.writeReply : app.msg.write} aria-describedby={reply ? 'reply-count' : 'new-post-count'}
			onkeydown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}></textarea>
		{#if error}<p class="error" role="alert">{error}</p>{/if}
		<p id={reply ? 'reply-count' : 'new-post-count'} class="muted">{text.length}/1000 {app.msg.characterCount}</p>
		<div class="composer-footer">
			{#if !reply}
				{#if place}<button type="button" disabled={busy} onclick={() => place = undefined}><MapPinX aria-hidden="true" />{app.msg.removePlace}</button>
				{:else}<button type="button" disabled={busy} aria-haspopup="dialog" onclick={() => showPlace = true}><MapPin aria-hidden="true" />{app.msg.place}</button>{/if}
			{/if}
			<button type="submit" class="primary" disabled={!canSubmit}><Send aria-hidden="true" />{busy ? app.msg.publishing : reply ? app.msg.sendReply : app.msg.post}</button>
		</div>
	</form>
</NativeDialog>

{#if !reply}<PlacePicker open={showPlace && open} value={place} onchoose={(point) => place = point} onclose={() => showPlace = false} />{/if}
