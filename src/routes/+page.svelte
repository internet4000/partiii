<script lang="ts">
	import { onMount } from 'svelte';
	import WorldMap from '$lib/components/WorldMap.svelte';
	import {
		approximatePlace, createPost, createReply, deleteRecord, initializeAccount,
		loadNetworkPage, loadPost, loadProfile, signIn, signOut,
		type Account, type NetworkPage, type Place, type Post, type Reply
	} from '$lib/atproto';
	import { t, type Locale } from '$lib/i18n';

	type View = 'feed' | 'map' | 'profile';
	let locale = $state<Locale>('en');
	let view = $state<View>('feed');
	let account = $state<Account | null>(null);
	let posts = $state<Post[]>([]);
	let active = $state<Post | null>(null);
	let profile = $state<{ did: string; handle: string; posts: Post[] } | null>(null);
	let composer = $state('');
	let replyText = $state('');
	let handle = $state('');
	let loading = $state(true);
	let submitting = $state(false);
	let authBusy = $state(false);
	let error = $state('');
	let notice = $state('');
	let mapOpen = $state(false);
	let chosenPlace = $state<Place | undefined>();
	let selectedPoint = $state<{ latitude: number; longitude: number } | undefined>();
	let copiedUri = $state('');
	let actionUri = $state('');
	let msg = $derived(t(locale));

	onMount(() => {
		const storedLocale = localStorage.getItem('partiii-locale');
		if (storedLocale === 'en' || storedLocale === 'de') locale = storedLocale;
		document.documentElement.lang = locale;
		const onPopState = () => {
			const wanted = decodeURIComponent(location.hash.slice(1));
			active = posts.find((post) => post.uri === wanted) ?? null;
			if (!location.hash) active = null;
		};
		window.addEventListener('popstate', onPopState);
		void start();
		return () => window.removeEventListener('popstate', onPopState);
	});

	async function start() {
		loading = true;
		try {
			try { account = await initializeAccount(); } catch { /* Public browsing does not require OAuth to be available. */ }
			await refresh();
			const wanted = decodeURIComponent(location.hash.slice(1));
			if (wanted.startsWith('at://')) {
				active = posts.find((post) => post.uri === wanted) ?? await loadPost(wanted).catch(() => null);
			}
		}
		finally { loading = false; }
	}

	async function refresh() {
		error = '';
		try { posts = (await loadNetworkPage()).posts; }
		catch { error = msg.loadError; }
	}

	function setLocale(next: Locale) {
		locale = next;
		document.documentElement.lang = next;
		localStorage.setItem('partiii-locale', next);
	}

	async function connect() {
		if (!handle.trim()) return;
		authBusy = true; error = '';
		try { await signIn(handle); }
		catch { error = msg.signInError; authBusy = false; }
	}

	async function disconnect() {
		await signOut(); account = null; profile = null; view = 'feed';
	}

	async function publish() {
		const text = composer.trim();
		if (!text || !account) { if (!account) error = msg.signInFirst; return; }
		submitting = true; error = '';
		try {
			const saved = await createPost(text, chosenPlace);
			const created: Post = { ...saved, authorDid: account.did, handle: account.handle, text, place: chosenPlace, replies: [] };
			posts = [created, ...posts];
			composer = ''; chosenPlace = undefined; mapOpen = false; notice = msg.post;
		} catch { error = msg.postError; }
		finally { submitting = false; }
	}

	async function reply() {
		const text = replyText.trim();
		if (!text || !active || !account) { if (!account) error = msg.signInFirst; return; }
		submitting = true; error = '';
		try {
			const target = active;
			const saved = await createReply(target, text);
			const newReply: Reply = { ...saved, authorDid: account.did, handle: account.handle, postUri: target.uri, text };
			replyText = '';
			active = { ...target, replies: [...target.replies, newReply] };
			posts = posts.map((post) => post.uri === target.uri ? { ...post, replies: [...post.replies, newReply] } : post);
		} catch { error = msg.replyError; }
		finally { submitting = false; }
	}

	async function openProfile(did: string) {
		view = 'profile'; profile = null; active = null; error = '';
		try {
			const result = await loadProfile(did);
			profile = { did, handle: result.handle, posts: result.posts };
		} catch { error = msg.loadError; }
	}

	function openPost(post: Post) {
		active = post; view = 'feed'; actionUri = '';
		history.pushState(null, '', `/#${encodeURIComponent(post.uri)}`);
	}

	function go(viewName: View) {
		view = viewName; active = null; actionUri = '';
		if (viewName === 'profile' && account) void openProfile(account.did);
		else profile = null;
		history.pushState(null, '', location.pathname);
	}

	function back() {
		active = null; history.pushState(null, '', location.pathname);
	}

	async function copyLink(post: Post) {
		const link = `${location.origin}/#${encodeURIComponent(post.uri)}`;
		try { await navigator.clipboard.writeText(link); copiedUri = post.uri; setTimeout(() => copiedUri = '', 1800); }
		catch { error = link; }
		actionUri = '';
	}

	function shareBluesky(post: Post) {
		const url = `${location.origin}/#${encodeURIComponent(post.uri)}`;
		const text = `${post.text.slice(0, 240)}${post.text.length > 240 ? '…' : ''} ${url}`;
		window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
		actionUri = '';
	}

	async function remove(post: Post) {
		if (!account || post.authorDid !== account.did) return;
		try { await deleteRecord(post.uri); posts = posts.filter((item) => item.uri !== post.uri); active = null; notice = msg.deleted; }
		catch { error = msg.deleteError; }
		actionUri = '';
	}

	async function removeReply(item: Reply) {
		if (!account || item.authorDid !== account.did) return;
		try {
			await deleteRecord(item.uri);
			if (active) active = { ...active, replies: active.replies.filter((reply) => reply.uri !== item.uri) };
			posts = posts.map((post) => post.uri === item.postUri ? { ...post, replies: post.replies.filter((reply) => reply.uri !== item.uri) } : post);
		} catch { error = msg.deleteError; }
	}

	function chooseMapPoint(point: { latitude: number; longitude: number }) {
		selectedPoint = point;
	}

	function acceptPlace() {
		if (!selectedPoint) return;
		chosenPlace = approximatePlace(selectedPoint.latitude, selectedPoint.longitude);
		mapOpen = false; selectedPoint = undefined;
	}

	function openPlacePicker() {
		selectedPoint = chosenPlace;
		mapOpen = true;
		setTimeout(() => document.getElementById('close-place')?.focus(), 0);
	}

	function closePlacePicker() {
		mapOpen = false;
		setTimeout(() => document.getElementById('choose-place')?.focus(), 0);
	}

	function cardPlaceLabel(place: Place) {
		if (place.label) return place.label;
		return `${place.latitude.toFixed(2)}°, ${place.longitude.toFixed(2)}°`;
	}

	function relativeTime(value: string) {
		const then = new Date(value).getTime();
		if (!Number.isFinite(then)) return '';
		const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
		const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
		if (seconds < 60) return relative.format(0, 'second');
		if (seconds < 3600) return relative.format(-Math.floor(seconds / 60), 'minute');
		if (seconds < 86400) return relative.format(-Math.floor(seconds / 3600), 'hour');
		return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(then);
	}
</script>

<svelte:head>
	<title>partiii</title>
	<meta name="theme-color" content="#f7f8f6" />
	<meta name="description" content="Public posts and replies about what could be better." />
</svelte:head>

<div class="app-shell">
	<header class="topbar">
		<a class="wordmark" href="/" aria-label="partiii" onclick={(event) => { event.preventDefault(); go('feed'); }}><span class="logo-mark" aria-hidden="true">◉</span><span>partiii</span></a>
		<div class="header-actions">
			<label class="sr-only" for="locale">{msg.language}</label>
			<select id="locale" class="locale-select" value={locale} onchange={(event) => setLocale(event.currentTarget.value as Locale)}><option value="en">EN</option><option value="de">DE</option></select>
			{#if account}
				<button class="account-chip" onclick={() => void openProfile(account!.did)} aria-label={`${msg.connected} ${account.handle}`}><span class="account-dot"></span><span class="handle">{account.handle}</span></button>
			{:else}<button class="connect-top" onclick={() => document.getElementById('handle')?.focus()}>{msg.connect}</button>{/if}
		</div>
	</header>

	<div class="app-layout">
		<nav class="desktop-nav" aria-label="Main navigation">
			<button class:active-nav={view === 'feed' && !active} onclick={() => go('feed')}><span class="nav-icon">◷</span>{msg.feed}</button>
			<button class:active-nav={view === 'map'} onclick={() => go('map')}><span class="nav-icon">◎</span>{msg.map}</button>
			<button class:active-nav={view === 'profile'} onclick={() => account ? void openProfile(account.did) : document.getElementById('handle')?.focus()}><span class="nav-icon">◯</span>{msg.profile}</button>
		</nav>

		<main>
			{#if error && view !== 'feed'}<div class="inline-error" role="alert">{error}<button onclick={() => void refresh()}>{msg.tryAgain}</button></div>{/if}
			{#if active}
				<div class="page-heading"><button class="back-button" onclick={back} aria-label={msg.back}>←</button><h1>{msg.replies}</h1></div>
				{@const thread = posts.find((item) => item.uri === active?.uri) ?? active}
				<article class="post-card thread-post">
					<header class="post-header"><button class="identity" onclick={() => void openProfile(thread.authorDid)}><span class="avatar">{thread.handle[0]?.toUpperCase() ?? '?'}</span><span class="identity-copy"><strong>{thread.handle}</strong><time datetime={thread.createdAt}>{relativeTime(thread.createdAt)}</time></span></button><button class="more-button" aria-label={msg.menu} aria-expanded={actionUri === thread.uri} onclick={() => actionUri = actionUri === thread.uri ? '' : thread.uri}>•••</button></header>
					<p class="post-text lead-text">{thread.text}</p>
					{#if thread.place}<button class="place-pill" onclick={() => { selectedPoint = { latitude: thread.place!.latitude, longitude: thread.place!.longitude }; go('map'); }}><span aria-hidden="true">⌖</span>{cardPlaceLabel(thread.place)}</button>{/if}
					{#if actionUri === thread.uri}<div class="action-menu"><button onclick={() => void copyLink(thread)}>{copiedUri === thread.uri ? msg.copied : msg.copyLink}</button><button onclick={() => shareBluesky(thread)}>{msg.shareBluesky}</button>{#if account?.did === thread.authorDid}<button class="danger-action" onclick={() => void remove(thread)}>{msg.delete}</button>{/if}</div>{/if}
					<div class="post-footer"><button onclick={() => document.getElementById('reply-input')?.focus()}>↩ <span>{msg.reply}</span></button><button onclick={() => void copyLink(thread)} aria-label={copiedUri === thread.uri ? msg.copied : msg.copyLink}>↗ <span>{copiedUri === thread.uri ? msg.copied : msg.copyLink}</span></button></div>
				</article>
				<section class="reply-list" aria-label={msg.replies}>
					{#each thread.replies as item (item.uri)}
						<article class="reply-card"><header class="post-header"><button class="identity" onclick={() => void openProfile(item.authorDid)}><span class="avatar reply-avatar">{item.handle[0]?.toUpperCase() ?? '?'}</span><span class="identity-copy"><strong>{item.handle}</strong><time datetime={item.createdAt}>{relativeTime(item.createdAt)}</time></span></button>{#if account?.did === item.authorDid}<button class="reply-delete" onclick={() => void removeReply(item)}>{msg.delete}</button>{/if}</header><p class="post-text">{item.text}</p></article>
					{:else}<p class="quiet-empty">{msg.noReplies}</p>{/each}
				</section>
				{#if account}
					<form class="reply-composer" onsubmit={(event) => { event.preventDefault(); void reply(); }}><label class="sr-only" for="reply-input">{msg.writeReply}</label><textarea id="reply-input" bind:value={replyText} maxlength="1000" placeholder={msg.writeReply}></textarea><div class="form-bottom"><span>{replyText.length}/1000</span><button class="primary-button" disabled={!replyText.trim() || submitting}>{msg.sendReply}</button></div></form>
				{:else}{@render LoginBox(msg, handle, authBusy, (value: string) => handle = value, () => void connect())}{/if}
			{:else if view === 'map'}
				<div class="page-heading"><div><p class="eyebrow">{msg.map}</p><h1>{msg.map}</h1></div></div>
				<WorldMap posts={posts} selectable={false} onselect={chooseMapPoint} onpost={openPost} />
				<div class="map-post-list">
					{#each posts.filter((post) => post.place) as post (post.uri)}
						<article class="compact-post"><button class="compact-main" onclick={() => openPost(post)}><span class="place-label">⌖ {cardPlaceLabel(post.place!)}</span><span class="compact-copy">{post.text}</span><span class="compact-meta">{post.handle} · {relativeTime(post.createdAt)}</span></button></article>
					{:else}<p class="quiet-empty">{msg.noLocationPosts}</p>{/each}
				</div>
			{:else if view === 'profile'}
				<div class="page-heading"><div><p class="eyebrow">{msg.profile}</p><h1>{profile?.handle ?? account?.handle ?? msg.profile}</h1></div></div>
				{#if account}<button class="text-button signout" onclick={() => void disconnect()}>{msg.signOut}</button>{/if}
				{#if !profile}<div class="quiet-empty">{loading ? msg.loading : ''}</div>
				{:else}{#each profile.posts as post (post.uri)}{@render PostCard(post, openPost, openProfile, actionUri, (value) => actionUri = value, copiedUri, copyLink, shareBluesky, (item) => void remove(item), account, relativeTime, msg, cardPlaceLabel)}{:else}<p class="quiet-empty">{msg.noProfilePosts}</p>{/each}{/if}
			{:else}
				<div class="page-heading feed-heading"><div><p class="eyebrow">{msg.newest}</p><h1>{msg.feed}</h1></div><button class="refresh-button" onclick={() => void refresh()} aria-label={msg.refresh} title={msg.refresh}>↻</button></div>
				{#if account}
					<form class="composer" onsubmit={(event) => { event.preventDefault(); void publish(); }}>
						<label for="new-post">{msg.prompt}</label><textarea id="new-post" bind:value={composer} maxlength="1000" placeholder={msg.write}></textarea>
						{#if chosenPlace}<div class="chosen-place"><span>⌖ {cardPlaceLabel(chosenPlace)}</span><button type="button" onclick={() => chosenPlace = undefined}>{msg.removePlace}</button></div>{/if}
						<div class="form-bottom"><button id="choose-place" class="place-button" type="button" onclick={openPlacePicker}>{msg.place}</button><span class="counter">{composer.length}/1000</span><button class="primary-button" disabled={!composer.trim() || submitting}>{submitting ? '…' : msg.post}</button></div>
						<p class="privacy-copy">{msg.privacy}</p>
					</form>
				{:else}{@render LoginBox(msg, handle, authBusy, (value: string) => handle = value, () => void connect())}{/if}
				<section class="feed-list" aria-label={msg.feed}>
					{#if loading}<p class="quiet-empty">{msg.loading}</p>
					{:else if !posts.length}<p class="quiet-empty">{msg.noPosts}</p>
					{:else}{#each posts as post (post.uri)}{@render PostCard(post, openPost, openProfile, actionUri, (value) => actionUri = value, copiedUri, copyLink, shareBluesky, (item) => void remove(item), account, relativeTime, msg, cardPlaceLabel)}{/each}{/if}
				</section>
			{/if}
		</main>
		<aside class="side-panel">
			{#if account}<div class="account-panel"><span class="avatar large-avatar">{account.handle[0]?.toUpperCase() ?? '?'}</span><span class="identity-copy"><strong>{account.handle}</strong><small>{msg.connected}</small></span><button class="text-button" onclick={() => void disconnect()}>{msg.signOut}</button></div>{/if}
			<div class="network-note"><span class="network-dot"></span>AT Protocol</div>
		</aside>
	</div>

	<nav class="mobile-nav" aria-label="Main navigation"><button class:active-nav={view === 'feed' && !active} onclick={() => go('feed')}><span>◷</span>{msg.feed}</button><button class:active-nav={view === 'map'} onclick={() => go('map')}><span>◎</span>{msg.map}</button><button class:active-nav={view === 'profile'} onclick={() => account ? void openProfile(account.did) : document.getElementById('handle')?.focus()}><span>◯</span>{msg.profile}</button></nav>
	{#if mapOpen}<div class="modal-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closePlacePicker(); }}><div class="place-dialog" role="dialog" aria-modal="true" aria-labelledby="place-title" tabindex="-1" onkeydown={(event) => { if (event.key === 'Escape') closePlacePicker(); }}><div class="dialog-heading"><h2 id="place-title">{msg.place}</h2><button id="close-place" class="icon-button" onclick={closePlacePicker} aria-label={msg.close}>×</button></div><p>{msg.placeHelp}</p><p class="map-instruction">{msg.choosePlace}</p><WorldMap selectable selected={selectedPoint} onselect={chooseMapPoint} /><div class="dialog-actions"><button class="secondary-button" onclick={closePlacePicker}>{msg.cancel}</button><button class="primary-button" disabled={!selectedPoint} onclick={acceptPlace}>{msg.savePlace}</button></div></div></div>{/if}
	{#if notice}<div class="toast" role="status">{notice}<button aria-label={msg.close} onclick={() => notice = ''}>×</button></div>{/if}
</div>

{#snippet PostCard(post: Post, openPost: (post: Post) => void, openProfile: (did: string) => void, actionUri: string, setActionUri: (uri: string) => void, copiedUri: string, copyLink: (post: Post) => void, shareBluesky: (post: Post) => void, remove: (post: Post) => void, account: Account | null, relativeTime: (date: string) => string, msg: ReturnType<typeof t>, cardPlaceLabel: (place: Place) => string)}
	<article class="post-card">
		<header class="post-header"><button class="identity" onclick={() => void openProfile(post.authorDid)}><span class="avatar">{post.handle[0]?.toUpperCase() ?? '?'}</span><span class="identity-copy"><strong>{post.handle}</strong><time datetime={post.createdAt}>{relativeTime(post.createdAt)}</time></span></button><button class="more-button" aria-label={msg.menu} aria-expanded={actionUri === post.uri} onclick={() => setActionUri(actionUri === post.uri ? '' : post.uri)}>•••</button></header>
		<button class="post-body" onclick={() => openPost(post)}><span class="post-text">{post.text}</span></button>
		{#if post.place}<button class="place-pill" onclick={() => openPost(post)}><span aria-hidden="true">⌖</span>{cardPlaceLabel(post.place)}</button>{/if}
		{#if actionUri === post.uri}<div class="action-menu"><button onclick={() => copyLink(post)}>{copiedUri === post.uri ? msg.copied : msg.copyLink}</button><button onclick={() => shareBluesky(post)}>{msg.shareBluesky}</button>{#if account?.did === post.authorDid}<button class="danger-action" onclick={() => remove(post)}>{msg.delete}</button>{/if}</div>{/if}
		<footer class="post-footer"><button onclick={() => openPost(post)}>↩ <span>{msg.reply}</span></button><button onclick={() => copyLink(post)} aria-label={copiedUri === post.uri ? msg.copied : msg.copyLink}>↗ <span>{copiedUri === post.uri ? msg.copied : msg.copyLink}</span></button></footer>
	</article>
{/snippet}

{#snippet LoginBox(msg: ReturnType<typeof t>, handle: string, authBusy: boolean, onhandle: (value: string) => void, onconnect: () => void)}
	<form class="login-box" onsubmit={(event) => { event.preventDefault(); onconnect(); }}><label for="handle">{msg.signInTitle}</label><div class="login-row"><input id="handle" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder={msg.handle} value={handle} oninput={(event) => onhandle(event.currentTarget.value)} /><button class="primary-button" disabled={!handle.trim() || authBusy}>{authBusy ? '…' : msg.connect}</button></div></form>
{/snippet}
