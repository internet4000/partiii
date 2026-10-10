<script lang="ts">
	import { onMount } from 'svelte';
	import { t, type Locale } from '$lib/i18n';
	type Reply = { id: string; author: string; text: string; date: string };
	type Post = { id: string; author: string; text: string; date: string; replies: Reply[] };
	const initialPosts: Post[] = [
		{ id: 'street-trees', author: 'Maya', text: 'Our street gets unbearably hot in summer. Could we plant more trees along the bus route?', date: 'Today', replies: [
			{ id: 'r1', author: 'Jonas', text: 'The corner by the library has wide planting strips. I can find out who looks after them.', date: '2 hours ago' },
			{ id: 'r2', author: 'Lea', text: 'A few neighbors have been asking about shade at the stop too.', date: '1 hour ago' }
		] },
		{ id: 'repair-cafe', author: 'Sam', text: 'I wish it were easier to find someone nearby to help repair small appliances instead of throwing them away.', date: 'Yesterday', replies: [
			{ id: 'r3', author: 'Noor', text: 'There is a monthly repair cafe at the community hall. Happy to share the details.', date: 'Today' }
		] },
		{ id: 'school-crossing', author: 'Ari', text: 'Crossing the road near the school feels unsafe, especially when children are arriving.', date: 'Yesterday', replies: [] }
	];
	let locale: Locale = $state('en');
	let posts: Post[] = $state(initialPosts);
	let composer = $state('');
	let replyText = $state('');
	let activeId = $state<string | null>(null);
	let page = $state<'feed' | 'profile'>('feed');
	let copied = $state(false);
	let notice = $state('');
	let dataReady = $state(false);
	const msg = $derived(t(locale));
	const active = $derived(posts.find((post) => post.id === activeId));

	onMount(() => {
		const stored = localStorage.getItem('common-ground-posts');
		if (stored) {
			try { posts = JSON.parse(stored) as Post[]; } catch { /* Keep sample posts if saved data is invalid. */ }
		}
		const savedLocale = localStorage.getItem('common-ground-locale');
		if (savedLocale === 'de' || savedLocale === 'en') locale = savedLocale;
		document.documentElement.lang = locale;
		const linkedPost = location.hash.slice(1);
		if (posts.some((post) => post.id === linkedPost)) activeId = linkedPost;
		dataReady = true;
	});
	function save() {
		if (dataReady) localStorage.setItem('common-ground-posts', JSON.stringify(posts));
	}
	function setLocale(value: Locale) {
		locale = value;
		document.documentElement.lang = value;
		localStorage.setItem('common-ground-locale', value);
	}
	function addPost() {
		const text = composer.trim();
		if (!text || text.length > 500) return;
		posts = [{ id: crypto.randomUUID(), author: msg.name, text, date: msg.justNow, replies: [] }, ...posts];
		composer = '';
		save();
	}
	function addReply() {
		const text = replyText.trim();
		if (!text || !active || text.length > 500) return;
		posts = posts.map((post) => post.id === active.id ? { ...post, replies: [...post.replies, { id: crypto.randomUUID(), author: msg.name, text, date: msg.justNow }] } : post);
		replyText = '';
		save();
	}
	async function copyLink(id: string) {
		await navigator.clipboard?.writeText(`${location.origin}/#${id}`);
		copied = true;
		setTimeout(() => copied = false, 1800);
	}
	function report() {
		notice = msg.reportUnavailable;
		setTimeout(() => notice = '', 3000);
	}
	function openPost(id: string) {
		activeId = id;
		page = 'feed';
		history.replaceState(null, '', `#${id}`);
	}
	function showFeed() {
		page = 'feed';
		activeId = null;
		history.replaceState(null, '', location.pathname);
	}
</script>

<svelte:head>
	<title>{msg.brand} — {msg.feed}</title>
	<meta name="description" content="A simple place to talk about what could be better." />
</svelte:head>

<div class="shell">
	<header class="topbar">
		<a class="wordmark" href="/" onclick={showFeed}>{msg.brand}<span class="mark" aria-hidden="true">✳</span></a>
		<div class="top-actions">
			<label class="sr-only" for="language">{msg.language}</label>
			<select id="language" value={locale} onchange={(event) => setLocale(event.currentTarget.value as Locale)} aria-label={msg.language}>
				<option value="en">EN</option><option value="de">DE</option>
			</select>
			<button class="avatar" aria-label={msg.profileLink} onclick={() => { page = 'profile'; activeId = null; }}>Y</button>
		</div>
	</header>
	<div class="layout">
		<aside class="sidebar" aria-label="Navigation">
			<button class:chosen={page === 'feed' && !activeId} onclick={showFeed}>◷ <span>{msg.feedLink}</span></button>
			<button class:chosen={page === 'profile'} onclick={() => { page = 'profile'; activeId = null; }}>◉ <span>{msg.profileLink}</span></button>
			<div class="side-note"><span class="note-dot"></span>{msg.demo}</div>
		</aside>
		<main>
			{#if page === 'profile'}
				<div class="section-heading"><div><p class="eyebrow">{msg.profileLink}</p><h1>{msg.name}</h1></div><div class="profile-mark">Y</div></div>
				<p class="profile-description">{msg.profile}</p>
				{#each posts.filter((post) => post.author === msg.name) as post (post.id)}
					<article class="post-card">
						<div class="post-header"><div class="avatar small">{post.author[0]}</div><div><strong>{post.author}</strong><span>{post.date}</span></div><button class="more" aria-label={msg.report} onclick={report}>···</button></div>
						<button class="post-body" onclick={() => openPost(post.id)}><span class="post-text">{post.text}</span></button>
						<div class="post-actions"><button onclick={() => openPost(post.id)}>↩ <span>{post.replies.length} {msg.replies}</span></button><button onclick={() => copyLink(post.id)}>↗ <span>{copied ? msg.copied : msg.copy}</span></button><button onclick={report}>⚑ <span>{msg.report}</span></button></div>
					</article>
				{:else}<div class="empty-state">{msg.empty}</div>{/each}
			{:else if active}
				<button class="back-link" onclick={showFeed}>← {msg.back}</button>
				<article class="thread-root">
					<div class="post-header"><div class="avatar small">{active.author[0]}</div><div><strong>{active.author}</strong><span>{active.date}</span></div><button class="more" aria-label={msg.report} onclick={report}>···</button></div>
					<p class="post-text large-text">{active.text}</p>
					<div class="post-actions"><button onclick={() => copyLink(active.id)}>↗ <span>{copied ? msg.copied : msg.copy}</span></button><button onclick={report}>⚑ <span>{msg.report}</span></button></div>
				</article>
				<div class="replies-heading"><h2>{active.replies.length} {msg.replies}</h2><span class="thread-line"></span></div>
				{#each active.replies as reply (reply.id)}
					<article class="reply-card"><div class="post-header"><div class="avatar small muted-avatar">{reply.author[0]}</div><div><strong>{reply.author}</strong><span>{reply.date}</span></div></div><p class="post-text">{reply.text}</p></article>
				{:else}<p class="no-replies">{msg.noReplies}</p>{/each}
				<form class="reply-box" onsubmit={(event) => { event.preventDefault(); addReply(); }}>
					<div class="avatar small">Y</div><textarea bind:value={replyText} maxlength="500" placeholder={msg.placeReply} aria-label={msg.reply}></textarea>
					<div class="reply-bottom"><span>{replyText.length}/500</span><button class="primary small-button" disabled={!replyText.trim()}>{msg.send} <span>→</span></button></div>
				</form>
			{:else}
				<div class="section-heading"><div><p class="eyebrow">{msg.brand}</p><h1>{msg.feed}</h1></div><span class="order-label">◷ &nbsp;{msg.newest}</span></div>
				<form class="composer" onsubmit={(event) => { event.preventDefault(); addPost(); }}>
					<label for="new-post">{msg.prompt}</label>
					<textarea id="new-post" bind:value={composer} maxlength="500" placeholder={msg.write}></textarea>
					<div class="composer-bottom"><span>{composer.length}/500</span><button class="primary" disabled={!composer.trim()}>{msg.share} <span>→</span></button></div>
				</form>
				<div class="feed-list">
					{#each posts as post (post.id)}
						<article class="post-card" id={post.id}>
							<div class="post-header"><button class="avatar small" aria-label={msg.profileLink} onclick={() => page = 'profile'}>{post.author[0]}</button><div><strong>{post.author}</strong><span>{post.date}</span></div><button class="more" aria-label={msg.report} onclick={report}>···</button></div>
							<button class="post-body" onclick={() => openPost(post.id)}><span class="post-text">{post.text}</span></button>
							<div class="post-actions"><button onclick={() => openPost(post.id)}>↩ <span>{post.replies.length} {msg.replies}</span></button><button onclick={() => copyLink(post.id)}>↗ <span>{copied ? msg.copied : msg.copy}</span></button><button onclick={report}>⚑ <span>{msg.report}</span></button></div>
						</article>
					{:else}<div class="empty-state">{msg.empty}</div>{/each}
				</div>
			{/if}
		</main>
		<aside class="right-rail"><div class="principle-card"><span class="principle-icon">✳</span><h2>{msg.principle}</h2><p>{msg.principleText}</p><div class="rule"></div><p class="small-print">{msg.noLikes}</p></div><div class="privacy-note">{msg.localOnly}</div></aside>
	</div>
	{#if notice}<div class="toast" role="status">{notice}</div>{/if}
</div>
