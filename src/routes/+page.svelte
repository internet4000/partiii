<script lang="ts">
	import { onMount } from 'svelte';
	import { useApp } from '$lib/app.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	const app = useApp();
	onMount(() => app.ensureFeed());
</script>

<section class="feed-page" aria-label={app.msg.feed}>
	<header class="page-heading"><h1>{app.msg.feed}</h1><button disabled={app.loading} onclick={() => app.refresh()}>{app.msg.refresh}</button></header>
	{#if app.feedError}<div class="empty error" role="alert">{app.msg.loadError}<button onclick={() => app.refresh()}>{app.msg.tryAgain}</button></div>
	{:else if app.loading && !app.posts.length}<p class="empty" role="status">{app.msg.loading}</p>
	{:else if !app.posts.length}<div class="empty"><p>{app.msg.noPosts}</p><button onclick={() => app.dialog = app.account ? 'compose' : 'login'}>{app.msg.prompt}</button></div>
	{:else}{#each app.posts as post (post.uri)}<PostCard {post} />{/each}{/if}
</section>
