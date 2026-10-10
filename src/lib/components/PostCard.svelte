<script lang="ts">
	import { useApp } from '$lib/app.svelte';
	import { deleteRecord, type Post } from '$lib/atproto';
	import { postPath, profilePath } from '$lib/records';
	let { post, thread = false, ondelete = () => {} }: { post: Post; thread?: boolean; ondelete?: () => void } = $props();
	const app = useApp();
	let notice = $state('');
	let error = $state('');
	let deleting = $state(false);
	async function copy() {
		const link = new URL(postPath(post.uri), location.origin).href;
		try { await navigator.clipboard.writeText(link); notice = app.msg.copied; }
		catch { notice = link; }
	}
	function share() {
		const link = new URL(postPath(post.uri), location.origin).href;
		window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(link)}`, '_blank', 'noopener,noreferrer');
	}
	async function remove() {
		deleting = true; error = '';
		try { await deleteRecord(post.uri); app.forget(post.uri); ondelete(); }
		catch { error = app.msg.deleteError; }
		finally { deleting = false; }
	}
</script>

<article class="post-card">
	<header class="post-header">
		<a class="identity" href={profilePath(post.authorDid)}>{post.handle}</a>
		<time datetime={post.createdAt}>{Number.isFinite(Date.parse(post.createdAt)) ? new Intl.DateTimeFormat(app.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(post.createdAt)) : ''}</time>
		<details class="post-actions"><summary aria-label={app.msg.menu}>•••</summary><div class="action-menu">
			<button onclick={copy}>{app.msg.copyLink}</button><button onclick={share}>{app.msg.shareBluesky}</button>
			{#if app.account?.did === post.authorDid}<button disabled={deleting} onclick={remove}>{app.msg.delete}</button>{/if}
		</div></details>
	</header>
	{#if thread}<p class="post-text" dir="auto">{post.text}</p>{:else}<a class="post-text post-link" dir="auto" href={postPath(post.uri)}>{post.text}</a>{/if}
	{#if post.place}<a class="place-link" href={`/map?lat=${post.place.latitude}&lng=${post.place.longitude}`}>{app.msg.location}: {post.place.label || `${post.place.latitude}°, ${post.place.longitude}°`}</a>{/if}
	{#if !thread}<a class="reply-link" href={postPath(post.uri)}>{app.msg.reply}</a>{/if}
	{#if notice}<p class="muted" role="status">{notice}</p>{/if}
	{#if error}<p class="error" role="alert">{error}</p>{/if}
</article>
