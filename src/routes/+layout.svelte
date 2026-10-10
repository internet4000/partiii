<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { provideApp } from '$lib/app.svelte';
	import { initializeAccount } from '$lib/atproto';
	import { postPath, profilePath } from '$lib/records';
	import AppDialogs from '$lib/components/AppDialogs.svelte';
	import type { Locale } from '$lib/i18n';
	import '../style.css';
	let { children } = $props();
	const app = provideApp();
	function locale(value: Locale) {
		app.locale = value;
		document.documentElement.lang = value;
		try { localStorage.setItem('partiii-locale', value); } catch { /* Session-only preference. */ }
	}
	onMount(() => {
		// OAuth state and callbacks must use the same loopback origin.
		if (location.hostname === 'localhost') {
			const url = new URL(location.href); url.hostname = '127.0.0.1'; location.replace(url); return;
		}
		try { const stored = localStorage.getItem('partiii-locale'); if (stored === 'en' || stored === 'de') locale(stored); } catch { /* Use default language. */ }
		void (async () => {
			try {
				app.account = await initializeAccount();
				const returnTo = sessionStorage.getItem('partiii-return-to');
				if (app.account && returnTo) {
					sessionStorage.removeItem('partiii-return-to');
					const destination = new URL(returnTo, location.origin);
					if (destination.origin === location.origin) await goto(destination.pathname + destination.search, { replaceState: true });
				}
			} catch (cause) {
				app.authError = cause instanceof Error ? cause.message : app.msg.signInError;
				app.dialog = 'login';
			} finally { app.authReady = true; }
			// Keep old shared fragment links usable when they reference current records.
			try { const uri = decodeURIComponent(location.hash.slice(1)); if (uri.startsWith('at://')) await goto(postPath(uri), { replaceState: true }); } catch { /* Ignore invalid fragments. */ }
		})();
	});
</script>

<svelte:head><title>partiii</title><meta name="theme-color" content="#f9faf8" /></svelte:head>
<div class="app-shell">
	<a class="skip-link" href="#content">{app.msg.skip}</a>
	<header class="topbar">
		<a class="wordmark" href="/">partiii</a>
		<nav aria-label={app.msg.navigation}>
			<a href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>{app.msg.feed}</a>
			<a href="/map" aria-current={page.url.pathname === '/map' ? 'page' : undefined}>{app.msg.map}</a>
			{#if app.account}<a href={profilePath(app.account.did)} aria-current={page.params.did === app.account.did && page.url.pathname.startsWith('/profile/') ? 'page' : undefined}>{app.msg.profile}</a>{/if}
		</nav>
		<div class="header-actions">
			<select aria-label={app.msg.language} value={app.locale} onchange={(event) => locale(event.currentTarget.value as Locale)}><option value="en">EN</option><option value="de">DE</option></select>
			<button class="primary" onclick={() => app.dialog = app.account ? 'compose' : 'login'}>{app.account ? app.msg.newPost : app.msg.connect}</button>
		</div>
	</header>
	<main id="content" tabindex="-1">{@render children()}</main>
</div>
<AppDialogs />
