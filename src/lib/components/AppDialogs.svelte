<script lang="ts">
	import { goto } from '$app/navigation';
	import { useApp } from '$lib/app.svelte';
	import { approximatePlace, createPost, signIn, type Place } from '$lib/atproto';
	import { postPath } from '$lib/records';
	import NativeDialog from './NativeDialog.svelte';
	import WorldMap from './WorldMap.svelte';

	const app = useApp();
	let handle = $state('');
	let text = $state('');
	let busy = $state(false);
	let error = $state('');
	let place = $state<Place>();
	let showPlace = $state(false);
	let latitude = $state<number | undefined>();
	let longitude = $state<number | undefined>();

	function choosePoint(point: Place) {
		place = approximatePlace(point.latitude, point.longitude);
		latitude = place.latitude; longitude = place.longitude;
	}
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
	async function publish() {
		if (!text.trim() || !app.account || busy) return;
		busy = true; error = '';
		try {
			const saved = await createPost(text, place);
			app.remember({ ...saved, authorDid: app.account.did, handle: app.account.handle, text: text.trim(), place, replies: [] });
			text = ''; place = undefined; showPlace = false;
			app.dialog = null;
			await goto(postPath(saved.uri));
		} catch { error = app.msg.postError; }
		finally { busy = false; }
	}
</script>

<NativeDialog open={app.dialog === 'login'} title={app.msg.connect} onclose={() => { if (app.dialog === 'login') app.dialog = null; }}>
	<header class="dialog-heading"><h2>{app.msg.connect}</h2><button type="button" onclick={() => app.dialog = null} aria-label={app.msg.close}>×</button></header>
	<form class="stack" onsubmit={(event) => { event.preventDefault(); void connect(); }}>
		<label for="handle">{app.msg.handle}</label>
		<input id="handle" bind:value={handle} autocomplete="username" autocapitalize="none" spellcheck="false" required placeholder="you.bsky.social" />
		{#if app.authError}<p class="error" role="alert">{app.msg.signInError}<br />{app.authError}</p>{/if}
		<button class="primary" disabled={busy || !handle.trim()}>{busy ? app.msg.connecting : app.msg.connect}</button>
	</form>
</NativeDialog>

<NativeDialog open={app.dialog === 'compose'} title={app.msg.prompt} onclose={() => { if (app.dialog === 'compose') app.dialog = null; }}>
	<header class="dialog-heading"><h2>{app.msg.prompt}</h2><button type="button" onclick={() => app.dialog = null} aria-label={app.msg.close}>×</button></header>
	<form class="stack" onsubmit={(event) => { event.preventDefault(); void publish(); }}>
		<label for="new-post">{app.msg.write}</label>
		<textarea id="new-post" bind:value={text} maxlength="1000" required dir="auto"></textarea>
		{#if place}<div class="row"><span>{place.latitude}°, {place.longitude}°</span><button type="button" onclick={() => { place = undefined; latitude = undefined; longitude = undefined; }}>{app.msg.removePlace}</button></div>{/if}
		<button type="button" aria-expanded={showPlace} onclick={() => showPlace = !showPlace}>{app.msg.place}</button>
		{#if showPlace && app.dialog === 'compose'}
			<p class="muted">{app.msg.placeHelp}</p>
			<div class="place-map"><WorldMap selectable selected={place} onselect={choosePoint} /></div>
			<div class="coordinates">
				<label>{app.msg.latitude}<input type="number" min="-90" max="90" step="any" bind:value={latitude} /></label>
				<label>{app.msg.longitude}<input type="number" min="-180" max="180" step="any" bind:value={longitude} /></label>
				<button type="button" disabled={latitude === undefined || longitude === undefined || Math.abs(latitude) > 90 || Math.abs(longitude) > 180} onclick={() => { if (latitude !== undefined && longitude !== undefined) choosePoint({ latitude, longitude }); }}>{app.msg.savePlace}</button>
			</div>
		{/if}
		{#if error}<p class="error" role="alert">{error}</p>{/if}
		<div class="form-actions"><span class="muted">{text.length}/1000</span><button class="primary" disabled={!app.account || !text.trim() || busy}>{busy ? '…' : app.msg.post}</button></div>
	</form>
</NativeDialog>
