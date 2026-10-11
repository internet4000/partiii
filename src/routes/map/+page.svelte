<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useApp } from '$lib/app.svelte';
	import { precisePlace } from '$lib/place';
	import WorldMap from '$lib/components/WorldMap.svelte';
	const app = useApp();
	const activePostUri = $derived(page.url.searchParams.get('post') ?? undefined);
	const activePost = $derived(app.posts.find((post) => post.uri === activePostUri));
	const point = $derived.by(() => {
		if (activePost?.place) return activePost.place;
		const lat = page.url.searchParams.get('lat'), lng = page.url.searchParams.get('lng');
		if (lat === null || lng === null) return undefined;
		const latitude = Number(lat), longitude = Number(lng);
		return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : undefined;
	});
	onMount(() => app.ensureFeed());
	async function locate(point: { latitude: number; longitude: number }) {
		const position = precisePlace(point.latitude, point.longitude);
		await goto(`/map?lat=${position.latitude}&lng=${position.longitude}`, { replaceState: true, keepFocus: true });
	}
</script>

<svelte:head><title>{app.msg.map} · partiii</title></svelte:head>
<section class="map-page" aria-label={app.msg.map}>
	<h1 class="sr-only">{app.msg.map}</h1>
	<WorldMap posts={app.posts} selected={point} focus={point} {activePostUri} onlocate={locate} onpost={(post) => post.place && goto(`/map?post=${encodeURIComponent(post.uri)}&lat=${post.place.latitude}&lng=${post.place.longitude}`, { replaceState: true })} />
</section>
