<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { useApp } from '$lib/app.svelte';
	import { createReply, deleteRecord, loadPost, type Post, type Reply } from '$lib/atproto';
	import { profilePath } from '$lib/records';
	import PostCard from '$lib/components/PostCard.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const app = useApp();
	let post = $state<Post | null>(null);
	let loading = $state(true);
	let failed = $state(false);
	let revision = $state(0);
	let text = $state('');
	let busy = $state(false);
	let error = $state('');
	$effect(() => {
		const uri = data.uri; revision;
		let current = true;
		post = untrack(() => app.posts.find((item) => item.uri === uri)) ?? null;
		loading = true; failed = false; text = ''; error = '';
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
	async function reply() {
		if (!post || !app.account || !text.trim() || busy) return;
		const target = post, account = app.account, content = text.trim();
		busy = true; error = '';
		try {
			const saved = await createReply(target, content);
			const updated = { ...target, replies: [...target.replies, { ...saved, authorDid: account.did, handle: account.handle, postUri: target.uri, text: content }] };
			app.remember(updated);
			if (data.uri === target.uri) { post = updated; text = ''; }
		} catch { error = app.msg.replyError; }
		finally { busy = false; }
	}
	async function removeReply(item: Reply) {
		try {
			await deleteRecord(item.uri);
			if (post?.uri === item.postUri) { post = { ...post, replies: post.replies.filter((reply) => reply.uri !== item.uri) }; app.remember(post); }
		} catch { error = app.msg.deleteError; }
	}
</script>

<svelte:head><title>{app.msg.conversation} · partiii</title></svelte:head>
<section class="thread-page">
	<header class="page-heading"><a href="/">← {app.msg.feed}</a><h1>{app.msg.conversation}</h1></header>
	{#if post}
		<PostCard {post} thread ondelete={() => goto('/')} />
		<section class="replies" aria-label={app.msg.replies}>
			{#each post.replies as item (item.uri)}<article class="post-card">
				<header class="post-header"><a class="identity" href={profilePath(item.authorDid)}>{item.handle}</a>{#if app.account?.did === item.authorDid}<button onclick={() => removeReply(item)}>{app.msg.delete}</button>{/if}</header>
				<p class="post-text" dir="auto">{item.text}</p>
			</article>{:else}<p class="muted section-padding">{app.msg.noReplies}</p>{/each}
		</section>
		{#if app.account}<form class="reply-form stack" onsubmit={(event) => { event.preventDefault(); void reply(); }}>
			<label for="reply">{app.msg.writeReply}</label><textarea id="reply" bind:value={text} maxlength="1000" required dir="auto"></textarea>
			<div class="form-actions"><span class="muted">{text.length}/1000</span><button class="primary" disabled={busy || !text.trim()}>{app.msg.reply}</button></div>
		</form>{:else}<div class="section-padding"><button onclick={() => app.dialog = 'login'}>{app.msg.connect}</button></div>{/if}
	{:else if loading}<p class="empty" role="status">{app.msg.loading}</p>
	{:else if !failed}<p class="empty">{app.msg.notFound}</p>{/if}
	{#if failed}<div class="section-padding error" role="alert">{app.msg.loadError}<button onclick={() => revision++}>{app.msg.tryAgain}</button></div>{/if}
	{#if error}<p class="section-padding error" role="alert">{error}</p>{/if}
</section>
