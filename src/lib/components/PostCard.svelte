<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Copy from '@lucide/svelte/icons/copy';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import NativeDialog from './NativeDialog.svelte';
	import { useApp } from '$lib/app.svelte';
	import { deleteRecord, type Post, type Reply } from '$lib/atproto';
	import { postPath, profilePath } from '$lib/records';
	let { post, thread = false, compact = true, ondelete = () => {} }: { post: Post | Reply; thread?: boolean; compact?: boolean; ondelete?: () => void } = $props();
	const app = useApp();
	const isReply = $derived('postUri' in post);
	const href = $derived(postPath('postUri' in post ? post.postUri : post.uri));
	const place = $derived('place' in post ? post.place : undefined);
	const menuTitle = $derived(isReply ? app.msg.replyMenu : app.msg.menu);
	let menuOpen = $state(false);
	let notice = $state('');
	let error = $state('');
	let deleting = $state(false);
	let nativeShare = $state(false);
	function openMenu() {
		nativeShare = typeof navigator.share === 'function';
		menuOpen = true;
	}
	async function copy() {
		const link = new URL(href, location.origin).href;
		try { await navigator.clipboard.writeText(link); notice = app.msg.copied; }
		catch { notice = link; }
		menuOpen = false;
	}
	async function share() {
		const link = new URL(href, location.origin).href;
		if (navigator.share) {
			try {
				await navigator.share({ title: 'partiii', text: post.text, url: link });
				menuOpen = false;
				return;
			} catch (cause) {
				if (cause instanceof DOMException && cause.name === 'AbortError') return;
				await copy();
				return;
			}
		}
		await copy();
	}
	async function remove() {
		if (!confirm(isReply ? app.msg.confirmDeleteReply : app.msg.confirmDelete)) return;
		deleting = true; error = '';
		try { await deleteRecord(post.uri); if (!isReply) app.forget(post.uri); ondelete(); }
		catch { error = isReply ? app.msg.deleteReplyError : app.msg.deleteError; }
		finally { deleting = false; menuOpen = false; }
	}
</script>

<article class="post-card" data-compact={(!thread && compact) || undefined}>
	<header class="post-header card-heading">
		<div class="post-meta">
		<a class="identity" href={profilePath(post.authorDid)}>{post.handle}</a>
		<time datetime={post.createdAt} title={post.createdAt}>{Number.isFinite(Date.parse(post.createdAt)) ? new Intl.DateTimeFormat(app.locale, { dateStyle: 'medium', ...(thread ? { timeStyle: 'short' as const } : {}) }).format(new Date(post.createdAt)) : ''}</time>
		{#if place}<span class="post-place" role="img" aria-label={app.msg.location} title={place.label || app.msg.location}><MapPin aria-hidden="true" /></span>{/if}
		{#if 'replies' in post && post.replies.length}<a class="post-replies" href={href} aria-label={`${post.replies.length} ${app.msg.replies}`}><MessageCircle aria-hidden="true" /><span>{post.replies.length}</span></a>{/if}
		</div>
		<button type="button" class="post-actions" aria-label={menuTitle} aria-haspopup="dialog" onclick={openMenu}><Ellipsis aria-hidden="true" /></button>
	</header>
	{#if thread}<p class="post-content post-text" dir="auto">{post.text}</p>{:else}<a class="post-content post-link" href={href}><p class="post-text" dir="auto">{post.text}</p></a>{/if}
	{#if notice}<p class="muted" role="status">{notice}</p>{/if}
	{#if error}<p class="error" role="alert">{error}</p>{/if}
</article>

<NativeDialog open={menuOpen} title={menuTitle} class="menu-dialog" dismissible={!deleting} onclose={() => menuOpen = false}>
	<header class="dialog-heading"><h2>{menuTitle}</h2><form method="dialog"><button disabled={deleting} aria-label={app.msg.close}><X aria-hidden="true" /></button></form></header>
	<div class="stack">
	<a href={href} onclick={() => menuOpen = false}><ArrowUpRight aria-hidden="true" />{app.msg.visitPost}</a>
	{#if !thread && 'replies' in post}<a href={href} onclick={() => menuOpen = false}><MessageCircle aria-hidden="true" />{app.msg.reply}{post.replies.length ? ` (${post.replies.length})` : ''}</a>{/if}
	{#if place}<a href={`/map?post=${encodeURIComponent(post.uri)}&lat=${place.latitude}&lng=${place.longitude}`} onclick={() => menuOpen = false}><MapPin aria-hidden="true" />{app.msg.showPlace}</a>{/if}
	<button type="button" onclick={share}>{#if nativeShare}<Share2 aria-hidden="true" />{app.msg.share}{:else}<Copy aria-hidden="true" />{app.msg.copyLink}{/if}</button>
	{#if app.account?.did === post.authorDid}<button type="button" disabled={deleting} onclick={remove}><Trash2 aria-hidden="true" />{deleting ? app.msg.loading : isReply ? app.msg.deleteReply : app.msg.delete}</button>{/if}</div>
</NativeDialog>
