<script lang="ts">
	import { onMount } from 'svelte';
	import { useApp } from '$lib/app.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	const app = useApp();
	onMount(() => app.ensureFeed());
</script>

<svelte:head><title>{app.msg.feed} · partiii</title></svelte:head>
<section class="feed-page" aria-label={app.msg.feed} aria-busy={app.loading || app.loadingMore}>
	<header class="page-heading"><h1>{app.msg.feed}</h1><button type="button" disabled={app.loading} onclick={() => app.refresh()}>{app.loading && app.posts.length ? app.msg.loading : app.msg.refresh}</button></header>
	{#if app.feedError}<div class="empty error" role="alert">{app.msg.loadError}<button type="button" onclick={() => app.refresh()}>{app.msg.tryAgain}</button></div>
	{:else if app.loading && !app.posts.length}<p class="empty" role="status">{app.msg.loading}</p>
	{:else if !app.posts.length}<div class="empty"><p>{app.msg.noPosts}</p><button type="button" onclick={() => app.dialog = app.account ? 'compose' : 'login'}>{app.msg.prompt}</button></div>
	{:else}{#each app.posts as post (post.uri)}<PostCard {post} />{/each}
		{#if app.loadMoreError}<div class="section-padding error" role="alert">{app.msg.loadError}<button type="button" onclick={() => app.loadMore()}>{app.msg.tryAgain}</button></div>{/if}
		{#if app.hasMore}<div class="section-padding"><button type="button" disabled={app.loadingMore} onclick={() => app.loadMore()}>{app.loadingMore ? app.msg.loadingMore : app.msg.loadMore}</button></div>{/if}{/if}
</section>
