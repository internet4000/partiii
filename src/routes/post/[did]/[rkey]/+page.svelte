<script lang="ts">
	import { untrack } from 'svelte';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import { goto } from '$app/navigation';
	import { useApp } from '$lib/app.svelte';
	import { createReply, loadPost, type Post, type Reply } from '$lib/atproto';
	import PostCard from '$lib/components/PostCard.svelte';
	import ComposerDialog from '$lib/components/ComposerDialog.svelte';
	import WorldMap from '$lib/components/WorldMap.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const app = useApp();
	let post = $state<Post | null>(null);
	let loading = $state(true);
	let failed = $state(false);
	let revision = $state(0);
	let replyOpen = $state(false);
	$effect(() => {
		const uri = data.uri; revision;
		let current = true;
		post = untrack(() => app.posts.find((item) => item.uri === uri)) ?? null;
		loading = true; failed = false; replyOpen = false;
		void loadPost(uri).then((result) => {
			if (!current) return;
			// Preserve confirmed local replies while relay discovery catches up.
			if (result) {
				const replies = new Map(result.replies.map((reply) => [reply.uri, reply]));
				for (const reply of post?.replies ?? []) replies.set(reply.uri, reply);
				post = { ...result, replies: [...replies.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) };
			}
		}).catch(() => { if (current) failed = true; }).finally(() => { if (current) loading = false; });
		return () => { current = false; };
	});
	async function reply(content: string) {
		if (!post || !app.account) throw new Error('Sign in to reply.');
		const target = post, account = app.account;
		const saved = await createReply(target, content);
		const latest = post?.uri === target.uri ? post : target;
		const updated = { ...latest, replies: [...latest.replies, { ...saved, authorDid: account.did, handle: account.handle, postUri: target.uri, text: content }] };
		app.remember(updated);
		if (data.uri === target.uri) post = updated;
	}
	function forgetReply(item: Reply) {
		if (post?.uri === item.postUri) { post = { ...post, replies: post.replies.filter((reply) => reply.uri !== item.uri) }; app.remember(post); }
	}
</script>

<svelte:head><title>{post ? `${post.handle}: ${post.text.slice(0, 80)}` : app.msg.post} · partiii</title></svelte:head>
<section class="thread-page" aria-label={app.msg.post}>
	{#if post}
		<PostCard {post} thread ondelete={() => goto('/')} />
		{#if post.place}<div class="post-map"><WorldMap selected={post.place} focus={post.place} /></div>{/if}
		<section class="replies" aria-label={app.msg.replies}>
			{#each post.replies as item (item.uri)}<PostCard post={item} thread ondelete={() => forgetReply(item)} />{/each}
		</section>
		<div class="thread-reply section-padding"><button type="button" class="reply-trigger" aria-haspopup="dialog" onclick={() => { if (app.account) replyOpen = true; else app.dialog = 'login'; }}><MessageCircle aria-hidden="true" />{app.msg.writeReply}</button></div>
		{#key data.uri}<ComposerDialog open={replyOpen} reply={true} onsubmit={reply} onclose={() => replyOpen = false} />{/key}
	{:else if loading}<p class="empty" role="status">{app.msg.loading}</p>
	{:else if !failed}<p class="empty">{app.msg.notFound}</p>{/if}
	{#if failed}<div class="section-padding error" role="alert">{app.msg.loadError}<button onclick={() => revision++}>{app.msg.tryAgain}</button></div>{/if}
</section>
