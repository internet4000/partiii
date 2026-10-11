<script lang="ts">
	import { onMount } from 'svelte';
	import Compass from '@lucide/svelte/icons/compass';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import LogIn from '@lucide/svelte/icons/log-in';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Info from '@lucide/svelte/icons/info';
	import Languages from '@lucide/svelte/icons/languages';
	import SunMoon from '@lucide/svelte/icons/sun-moon';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import UserRound from '@lucide/svelte/icons/user-round';
	import X from '@lucide/svelte/icons/x';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { provideApp } from '$lib/app.svelte';
	import { initializeAccount, signOut } from '$lib/atproto';
	import { postPath, profilePath } from '$lib/records';
	import AppDialogs from '$lib/components/AppDialogs.svelte';
	import NativeDialog from '$lib/components/NativeDialog.svelte';
	import type { Locale } from '$lib/i18n';
	import '../style.css';
	let { children } = $props();
	const app = provideApp();
	type Theme = 'auto' | 'light' | 'dark';
	let menuOpen = $state(false);
	let theme = $state<Theme>('auto');
	function locale(value: Locale) {
		app.locale = value;
		document.documentElement.lang = value;
		try { localStorage.setItem('partiii-locale', value); } catch { /* Session-only preference. */ }
	}
	function setTheme(value: Theme) {
		theme = value;
		document.documentElement.dataset.theme = value;
		try { localStorage.setItem('partiii-theme', value); } catch { /* Session-only preference. */ }
	}
	async function disconnect() {
		await signOut();
		app.account = null;
		menuOpen = false;
		await goto('/');
	}
	onMount(() => {
		// OAuth state and callbacks must use the same loopback origin.
		if (location.hostname === 'localhost') {
			const url = new URL(location.href); url.hostname = '127.0.0.1'; location.replace(url); return;
		}
		try { const stored = localStorage.getItem('partiii-locale'); if (stored === 'en' || stored === 'de') locale(stored); } catch { /* Use default language. */ }
		try { const stored = localStorage.getItem('partiii-theme'); if (stored === 'auto' || stored === 'light' || stored === 'dark') setTheme(stored); else setTheme('auto'); } catch { setTheme('auto'); }
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
	<main id="content" tabindex="-1">{@render children()}</main>
	<nav class="bottom-nav" aria-label={app.msg.navigation}>
		<a href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}><Compass aria-hidden="true" />{app.msg.feed}</a>
		<button type="button" aria-haspopup="dialog" onclick={() => app.dialog = app.account ? 'compose' : 'login'}><SquarePen aria-hidden="true" />{app.msg.newPost}</button>
		<button type="button" aria-haspopup="dialog" onclick={() => menuOpen = true}><Ellipsis aria-hidden="true" />{app.msg.more}</button>
	</nav>
</div>
<AppDialogs />
<NativeDialog open={menuOpen} title="partiii" class="menu-dialog" onclose={() => menuOpen = false}>
	<header class="dialog-heading"><h2><a href="/" onclick={() => menuOpen = false}>partiii</a></h2><form method="dialog"><button aria-label={app.msg.close}><X aria-hidden="true" /></button></form></header>
	<div class="stack">
		<a href="/" data-dialog-focus onclick={() => menuOpen = false}><Compass aria-hidden="true" /><span>{app.msg.feed}</span></a>
		{#if app.account}<a class="menu-profile" href={profilePath(app.account.did)} aria-label={`${app.msg.profile}: ${app.account.handle}`} title={app.account.did} onclick={() => menuOpen = false}><UserRound aria-hidden="true" /><span>{app.account.handle}</span></a><button type="button" onclick={disconnect}><LogOut aria-hidden="true" />{app.msg.signOut}</button>{:else}<button type="button" onclick={() => { menuOpen = false; app.dialog = 'login'; }}><LogIn aria-hidden="true" />{app.msg.connect}</button>{/if}
		<a href="/about" onclick={() => menuOpen = false}><Info aria-hidden="true" /><span>{app.msg.about}</span></a>
		<label class="menu-setting"><span><Languages aria-hidden="true" />{app.msg.language}</span><select value={app.locale} onchange={(event) => locale(event.currentTarget.value as Locale)}><option value="en">EN</option><option value="de">DE</option></select></label>
		<label class="menu-setting"><span><SunMoon aria-hidden="true" />{app.msg.theme}</span><select value={theme} onchange={(event) => setTheme(event.currentTarget.value as Theme)}><option value="auto">{app.msg.themeAuto}</option><option value="light">{app.msg.themeLight}</option><option value="dark">{app.msg.themeDark}</option></select></label>
	</div>
</NativeDialog>
