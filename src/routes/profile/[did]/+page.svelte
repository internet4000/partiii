<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useApp } from '$lib/app.svelte';
	import { loadProfile, type Post } from '$lib/atproto';
	import PostCard from '$lib/components/PostCard.svelte';
	import ProfileActions from '$lib/components/ProfileActions.svelte';
	import ViewPicker from '$lib/components/ViewPicker.svelte';
	import WorldMap from '$lib/components/WorldMap.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const app = useApp();
	let profile = $state<Awaited<ReturnType<typeof loadProfile>>>();
	let failed = $state(false);
	let avatarFailed = $state(false);
	let revision = $state(0);
	const view = $derived(page.url.searchParams.get('view') === 'map' ? 'map' : page.url.searchParams.get('view') === 'grid' ? 'grid' : 'list');
	const activePostUri = $derived(page.url.searchParams.get('post') ?? undefined);
	const point = $derived.by(() => {
		const active = profile?.posts.find((post) => post.uri === activePostUri);
		if (active?.place) return active.place;
		const lat = page.url.searchParams.get('lat'), lng = page.url.searchParams.get('lng');
		if (lat === null || lng === null) return undefined;
		const latitude = Number(lat), longitude = Number(lng);
		return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : undefined;
	});
	const focus = $derived(point ?? profile?.posts.find((post) => post.place)?.place);
	$effect(() => {
		const did = data.did; revision;
		let current = true;
		profile = undefined; failed = false; avatarFailed = false;
		void loadProfile(did).then((result) => { if (current) profile = result; }).catch(() => { if (current) failed = true; });
		return () => { current = false; };
	});
	async function changeView(value: 'list' | 'grid' | 'map') {
		const params = new URLSearchParams(page.url.searchParams);
		if (value === 'list') params.delete('view'); else params.set('view', value);
		await goto(`${page.url.pathname}${params.size ? `?${params}` : ''}`, { keepFocus: true });
	}
	function showPost(post: Post) {
		if (!post.place) return;
		const params = new URLSearchParams(page.url.searchParams);
		params.set('post', post.uri); params.set('lat', String(post.place.latitude)); params.set('lng', String(post.place.longitude));
		void goto(`${page.url.pathname}?${params}`, { replaceState: true, keepFocus: true });
	}
	async function locate(point: { latitude: number; longitude: number }) {
		const params = new URLSearchParams(page.url.searchParams);
		params.delete('post'); params.set('lat', String(point.latitude)); params.set('lng', String(point.longitude));
		await goto(`${page.url.pathname}?${params}`, { replaceState: true, keepFocus: true });
	}
</script>

<svelte:head><title>{profile?.handle ?? app.msg.profile} · partiii</title></svelte:head>
<section class="feed-page">
	<header class="page-heading"><div class="profile-identity">{#if profile?.avatar && !avatarFailed}<img class="profile-avatar" src={profile.avatar} alt="" width="80" height="80" onerror={() => avatarFailed = true} />{/if}<h1>{profile?.handle ?? app.msg.profile}</h1></div><div class="profile-actions"><ViewPicker {view} onchoose={changeView} /><ProfileActions did={data.did} handle={profile?.handle} /></div></header>
	{#if failed}<div class="empty error" role="alert">{app.msg.loadError}<button onclick={() => revision++}>{app.msg.tryAgain}</button></div>
	{:else if !profile}<p class="empty" role="status">{app.msg.loading}</p>
	{:else if !profile.posts.length}<p class="empty">{app.msg.noProfilePosts}</p>
	{:else if view === 'map'}
		{#if profile.posts.some((post) => post.place)}<div class="home-map"><WorldMap posts={profile.posts} selected={point} {focus} {activePostUri} onpost={showPost} onlocate={locate} /></div>{:else}<p class="empty">{app.msg.noLocationPosts}</p>{/if}
	{:else}<div class:post-grid={view === 'grid'}>{#each profile.posts as post (post.uri)}<PostCard {post} ondelete={() => { if (profile) profile.posts = profile.posts.filter((item) => item.uri !== post.uri); }} />{/each}</div>{/if}
</section>
