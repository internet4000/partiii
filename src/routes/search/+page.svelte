<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useApp } from '$lib/app.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import SearchToolbar from '$lib/components/SearchToolbar.svelte';
	const app = useApp();
	const query = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const results = $derived.by(() => {
		const term = query.toLocaleLowerCase(app.locale);
		if (!term) return app.posts;
		return app.posts.filter((post) => `${post.handle} ${post.text} ${post.place?.label ?? ''}`.toLocaleLowerCase(app.locale).includes(term));
	});
	onMount(() => app.ensureFeed());
	async function submit(value: string) {
		await goto(value ? `/search?q=${encodeURIComponent(value)}` : '/search', { keepFocus: true });
	}
</script>

<svelte:head><title>{app.msg.search} · partiii</title></svelte:head>
<section class="feed-page" aria-label={app.msg.searchResults} aria-busy={app.loading || app.loadingMore}>
	<header class="page-heading"><h1>{app.msg.searchResults}</h1></header>
	<SearchToolbar {query} onsearch={submit} />
	{#if app.feedError}<div class="empty error" role="alert">{app.msg.loadError}<button type="button" onclick={() => app.refresh()}>{app.msg.tryAgain}</button></div>
	{:else if app.loading && !app.posts.length}<p class="empty" role="status">{app.msg.loading}</p>
	{:else}{#each results as post (post.uri)}<PostCard {post} compact />{:else}<p class="empty">{query ? app.msg.noSearchResults : app.msg.noPosts}</p>{/each}
		{#if app.hasMore}<div class="section-padding"><button type="button" disabled={app.loadingMore} onclick={() => app.loadMore()}>{app.loadingMore ? app.msg.loadingMore : app.msg.loadMore}</button></div>{/if}{/if}
</section>
