<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useApp } from '$lib/app.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import WorldMap from '$lib/components/WorldMap.svelte';
	import SearchToolbar from '$lib/components/SearchToolbar.svelte';
	const app = useApp();
	const query = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const view = $derived(page.url.searchParams.get('view') === 'map' ? 'map' : page.url.searchParams.get('view') === 'grid' ? 'grid' : 'list');
	const activePostUri = $derived(page.url.searchParams.get('post') ?? undefined);
	const posts = $derived.by(() => {
		const term = query.toLocaleLowerCase(app.locale);
		if (!term) return app.posts;
		return app.posts.filter((post) => `${post.handle} ${post.text} ${post.place?.label ?? ''}`.toLocaleLowerCase(app.locale).includes(term));
	});
	const activePost = $derived(posts.find((post) => post.uri === activePostUri));
	const point = $derived.by(() => {
		if (activePost?.place) return activePost.place;
		const lat = page.url.searchParams.get('lat'), lng = page.url.searchParams.get('lng');
		if (lat === null || lng === null) return undefined;
		const latitude = Number(lat), longitude = Number(lng);
		return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : undefined;
	});
	onMount(() => app.ensureFeed());
	async function search(value: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (value) params.set('q', value); else params.delete('q');
		await goto(`/${params.size ? `?${params}` : ''}`, { keepFocus: true });
	}
	async function changeView(value: 'list' | 'grid' | 'map') {
		const params = new URLSearchParams(page.url.searchParams);
		if (value === 'list') params.delete('view'); else params.set('view', value);
		await goto(`/${params.size ? `?${params}` : ''}`, { keepFocus: true });
	}
	async function locate(point: { latitude: number; longitude: number }) {
		const params = new URLSearchParams(page.url.searchParams);
		params.delete('post'); params.set('lat', String(point.latitude)); params.set('lng', String(point.longitude));
		await goto(`/?${params}`, { replaceState: true, keepFocus: true });
	}
	function showPost(post: typeof posts[number]) {
		if (!post.place) return;
		const params = new URLSearchParams();
		params.set('view', 'map');
		if (query) params.set('q', query);
		params.set('post', post.uri);
		params.set('lat', String(post.place.latitude));
		params.set('lng', String(post.place.longitude));
		void goto(`/?${params}`, { replaceState: true });
	}
</script>

<svelte:head><title>{query ? `${query} · ${app.msg.search}` : app.msg.feed} · partiii</title></svelte:head>
<section class="feed-page" aria-label={app.msg.feed} aria-busy={app.loading || app.loadingMore}>
	<h1 class="sr-only">{app.msg.feed}</h1>
	<SearchToolbar {query} {view} onsearch={search} onviewchange={changeView} />
	{#if app.feedError}<div class="empty error" role="alert">{app.msg.loadError}<button type="button" onclick={() => app.refresh()}>{app.msg.tryAgain}</button></div>
	{:else if app.loading && !app.posts.length}<p class="empty" role="status">{app.msg.loading}</p>
	{:else if !app.posts.length}<div class="empty"><p>{app.msg.noPosts}</p></div>
	{:else if !posts.length}<div class="empty"><p>{app.msg.noSearchResults}</p>{#if app.hasMore}<button type="button" disabled={app.loadingMore} onclick={() => app.loadMore()}>{app.loadingMore ? app.msg.loadingMore : app.msg.loadMore}</button>{/if}</div>
	{:else if view === 'map'}<div class="home-map"><WorldMap {posts} selected={point} focus={point} {activePostUri} onpost={showPost} onlocate={locate} /></div>
		{#if app.hasMore}<div class="section-padding"><button type="button" disabled={app.loadingMore} onclick={() => app.loadMore()}>{app.loadingMore ? app.msg.loadingMore : app.msg.loadMore}</button></div>{/if}
	{:else}<div class:post-grid={view === 'grid'}>{#each posts as post (post.uri)}<PostCard {post} />{/each}</div>
		{#if app.loadMoreError}<div class="section-padding error" role="alert">{app.msg.loadError}<button type="button" onclick={() => app.loadMore()}>{app.msg.tryAgain}</button></div>{/if}
		{#if app.hasMore}<div class="section-padding"><button type="button" disabled={app.loadingMore} onclick={() => app.loadMore()}>{app.loadingMore ? app.msg.loadingMore : app.msg.loadMore}</button></div>{/if}{/if}
</section>
