<script lang="ts">
	import { goto } from '$app/navigation';
	import LogIn from '@lucide/svelte/icons/log-in';
	import X from '@lucide/svelte/icons/x';
	import { useApp } from '$lib/app.svelte';
	import { createPost, signIn, type Place } from '$lib/atproto';
	import { postPath } from '$lib/records';
	import NativeDialog from './NativeDialog.svelte';
	import ComposerDialog from './ComposerDialog.svelte';

	const app = useApp();
	let handle = $state('');
	let busy = $state(false);
	async function connect() {
		if (!handle.trim() || busy) return;
		busy = true; app.authError = '';
		try {
			sessionStorage.setItem('partiii-return-to', location.pathname + location.search);
			await signIn(handle);
		} catch (cause) {
			app.authError = cause instanceof Error ? cause.message : app.msg.signInError;
		} finally { busy = false; }
	}
	async function publish(text: string, place?: Place) {
		if (!app.account) throw new Error('Sign in to publish.');
		const account = app.account;
		const saved = await createPost(text, place);
		app.remember({ ...saved, authorDid: account.did, handle: account.handle, text, place, replies: [] });
		await goto(postPath(saved.uri));
	}
</script>

<NativeDialog open={app.dialog === 'login'} title={app.msg.connect} onclose={() => { if (app.dialog === 'login') app.dialog = null; }}>
	<header class="dialog-heading"><h2>{app.msg.connect}</h2><form method="dialog"><button aria-label={app.msg.close}><X aria-hidden="true" /></button></form></header>
	<form class="stack" onsubmit={(event) => { event.preventDefault(); void connect(); }}>
		<label for="handle">{app.msg.handle}</label>
		<input id="handle" bind:value={handle} autocomplete="username" autocapitalize="none" spellcheck="false" required placeholder="you.bsky.social" />
		{#if app.authError}<p class="error" role="alert">{app.msg.signInError}<br />{app.authError}</p>{/if}
		<button type="submit" class="primary" disabled={busy || !handle.trim()}><LogIn aria-hidden="true" />{busy ? app.msg.connecting : app.msg.connect}</button>
	</form>
</NativeDialog>

<ComposerDialog open={app.dialog === 'compose'} onsubmit={publish} onclose={() => { if (app.dialog === 'compose') app.dialog = null; }} />
