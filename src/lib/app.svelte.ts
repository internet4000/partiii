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
	cursor = $state<{ posts?: string; replies?: string }>({});
	loading = $state(false);
	loadingMore = $state(false);
	loaded = $state(false);
	feedError = $state(false);
	loadMoreError = $state(false);
	get msg() { return t(this.locale); }
	get hasMore() { return Boolean(this.cursor.posts || this.cursor.replies); }

	merge(posts: Post[]) {
		const byUri = new Map([...this.posts, ...posts].map((post) => [post.uri, post]));
		this.posts = [...byUri.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}
	async refresh() {
		if (this.loading) return;
		this.loading = true;
		this.feedError = false;
		this.loadMoreError = false;
		try {
			const page = await loadNetworkPage();
			this.posts = page.posts;
			this.cursor = page.cursor;
			this.loaded = true;
		} catch { this.feedError = true; }
		finally { this.loading = false; }
	}
	async loadMore() {
		if (this.loadingMore || !this.hasMore) return;
		this.loadingMore = true;
		this.loadMoreError = false;
		try {
			const page = await loadNetworkPage(this.cursor);
			this.merge(page.posts);
			this.cursor = page.cursor;
		} catch { this.loadMoreError = true; }
		finally { this.loadingMore = false; }
	}
	ensureFeed() { if (!this.loaded) void this.refresh(); }
	remember(post: Post) { this.merge([post]); }
	forget(uri: string) { this.posts = this.posts.filter((post) => post.uri !== uri); }
}
export function provideApp() { return setContext(APP, new App()); }
export function useApp() { return getContext<App>(APP); }
