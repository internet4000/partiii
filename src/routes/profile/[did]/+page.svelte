<script lang="ts">
	import { goto } from '$app/navigation';
	import { useApp } from '$lib/app.svelte';
	import { loadProfile, signOut } from '$lib/atproto';
	import PostCard from '$lib/components/PostCard.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const app = useApp();
	let profile = $state<Awaited<ReturnType<typeof loadProfile>>>();
	let failed = $state(false);
	let revision = $state(0);
	$effect(() => {
		const did = data.did; revision;
		let current = true;
		profile = undefined; failed = false;
		void loadProfile(did).then((result) => { if (current) profile = result; }).catch(() => { if (current) failed = true; });
		return () => { current = false; };
	});
	async function disconnect() {
		await signOut(); app.account = null; await goto('/');
	}
</script>

<svelte:head><title>{profile?.handle ?? app.msg.profile} · partiii</title></svelte:head>
<section class="feed-page">
	<header class="page-heading"><h1>{profile?.handle ?? app.msg.profile}</h1>{#if app.account?.did === data.did}<button onclick={disconnect}>{app.msg.signOut}</button>{/if}</header>
	{#if failed}<div class="empty error" role="alert">{app.msg.loadError}<button onclick={() => revision++}>{app.msg.tryAgain}</button></div>
	{:else if !profile}<p class="empty" role="status">{app.msg.loading}</p>
	{:else}{#each profile.posts as post (post.uri)}<PostCard {post} ondelete={() => { if (profile) profile.posts = profile.posts.filter((item) => item.uri !== post.uri); }} />{:else}<p class="empty">{app.msg.noProfilePosts}</p>{/each}{/if}
</section>
