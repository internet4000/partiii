import { getContext, setContext } from 'svelte';
import { loadNetworkPage, type Account, type Post } from './atproto';
import { t, type Locale } from './i18n';

const APP = Symbol('partiii');
export class App {
	locale = $state<Locale>('en');
	account = $state<Account | null>(null);
	authReady = $state(false);
	authError = $state('');
	dialog = $state<'login' | 'compose' | null>(null);
	posts = $state<Post[]>([]);
	loading = $state(false);
	loaded = $state(false);
	feedError = $state(false);
	get msg() { return t(this.locale); }

	async refresh() {
		if (this.loading) return;
		this.loading = true;
		this.feedError = false;
		try { this.posts = (await loadNetworkPage()).posts; this.loaded = true; }
		catch { this.feedError = true; }
		finally { this.loading = false; }
	}
	ensureFeed() { if (!this.loaded) void this.refresh(); }
	remember(post: Post) {
		this.posts = [post, ...this.posts.filter((item) => item.uri !== post.uri)]
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}
	forget(uri: string) { this.posts = this.posts.filter((post) => post.uri !== uri); }
}
export function provideApp() { return setContext(APP, new App()); }
export function useApp() { return getContext<App>(APP); }
