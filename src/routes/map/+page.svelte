<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useApp } from '$lib/app.svelte';
	import { postPath } from '$lib/records';
	import WorldMap from '$lib/components/WorldMap.svelte';
	const app = useApp();
	const point = $derived.by(() => {
		const lat = page.url.searchParams.get('lat'), lng = page.url.searchParams.get('lng');
		if (lat === null || lng === null) return undefined;
		const latitude = Number(lat), longitude = Number(lng);
		return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : undefined;
	});
	onMount(() => app.ensureFeed());
</script>

<svelte:head><title>{app.msg.map} · partiii</title></svelte:head>
<section class="map-page" aria-label={app.msg.map}>
	<h1 class="sr-only">{app.msg.map}</h1>
	{#key `${point?.latitude},${point?.longitude}`}<WorldMap posts={app.posts} selected={point} onpost={(post) => goto(postPath(post.uri))} />{/key}
	<details class="map-list"><summary>{app.msg.profilePosts}</summary>
		{#if app.feedError}<p role="alert">{app.msg.loadError}</p><button onclick={() => app.refresh()}>{app.msg.tryAgain}</button>
		{:else if app.loading}<p role="status">{app.msg.loading}</p>
		{:else}{#each app.posts.filter((post) => post.place) as post (post.uri)}<a href={postPath(post.uri)}>{post.text}</a>{:else}<p>{app.msg.noLocationPosts}</p>{/each}{/if}
	</details>
</section>
