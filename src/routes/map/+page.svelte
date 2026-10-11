<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useApp } from '$lib/app.svelte';
	import { postPath } from '$lib/records';
	import { getCurrentLocation, locationErrorKey } from '$lib/geolocation';
	import { precisePlace } from '$lib/place';
	import WorldMap from '$lib/components/WorldMap.svelte';
	import NativeDialog from '$lib/components/NativeDialog.svelte';
	const app = useApp();
	let postsOpen = $state(false);
	let locating = $state(false);
	let locationError = $state('');
	let request = 0;
	const point = $derived.by(() => {
		const lat = page.url.searchParams.get('lat'), lng = page.url.searchParams.get('lng');
		if (lat === null || lng === null) return undefined;
		const latitude = Number(lat), longitude = Number(lng);
		return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : undefined;
	});
	onMount(() => app.ensureFeed());
	onDestroy(() => { request++; });
	async function locate() {
		const current = ++request;
		locating = true; locationError = '';
		try {
			const result = await getCurrentLocation();
			if (current !== request) return;
			const position = precisePlace(result.latitude, result.longitude);
			await goto(`/map?lat=${position.latitude}&lng=${position.longitude}`, { replaceState: true });
		} catch (cause) { if (current === request) locationError = app.msg[locationErrorKey(cause)]; }
		finally { if (current === request) locating = false; }
	}
</script>

<svelte:head><title>{app.msg.map} · partiii</title></svelte:head>
<section class="map-page" aria-label={app.msg.map}>
	<h1 class="sr-only">{app.msg.map}</h1>
	<div class="map-toolbar"><button type="button" aria-haspopup="dialog" onclick={() => postsOpen = true}>{app.msg.places}</button><button type="button" disabled={locating} onclick={locate}>{locating ? app.msg.locating : app.msg.useMyLocation}</button>{#if locationError}<p class="error" role="alert">{locationError}</p>{/if}</div>
	{#key `${point?.latitude},${point?.longitude}`}<WorldMap posts={app.posts} selected={point} onpost={(post) => goto(postPath(post.uri))} />{/key}
</section>
<NativeDialog open={postsOpen} title={app.msg.places} onclose={() => postsOpen = false}>
	<header class="dialog-heading"><h2>{app.msg.places}</h2><button type="button" onclick={() => postsOpen = false} aria-label={app.msg.close}>×</button></header>
	<div class="stack">
		{#if app.feedError}<p role="alert">{app.msg.loadError}</p><button type="button" onclick={() => app.refresh()}>{app.msg.tryAgain}</button>
		{:else if app.loading}<p role="status">{app.msg.loading}</p>
		{:else}{#each app.posts.filter((post) => post.place) as post (post.uri)}<a href={postPath(post.uri)} onclick={() => postsOpen = false}>{post.text}</a>{:else}<p>{app.msg.noLocationPosts}</p>{/each}
			{#if app.hasMore}<button type="button" disabled={app.loadingMore} onclick={() => app.loadMore()}>{app.loadingMore ? app.msg.loadingMore : app.msg.loadMore}</button>{/if}{/if}
	</div>
</NativeDialog>
