import type { BrowserOAuthClient as BrowserOAuthClientType, OAuthSession } from '@atproto/oauth-client-browser';

import { POST_COLLECTION, REPLY_COLLECTION, OAUTH_SCOPE } from './records';
export { POST_COLLECTION, REPLY_COLLECTION } from './records';
export const PUBLIC_RELAY = 'https://relay1.us-west.bsky.network';

export type Place = { label?: string; latitude: number; longitude: number };
export type Reply = { uri: string; cid: string; authorDid: string; handle: string; text: string; createdAt: string; postUri: string };
export type Post = { uri: string; cid: string; authorDid: string; handle: string; text: string; createdAt: string; place?: Place; replies: Reply[] };
export type NetworkCursor = { posts?: string; replies?: string };
export type NetworkPage = { posts: Post[]; cursor: NetworkCursor };
export type Account = { did: string; handle: string };

let oauthClient: BrowserOAuthClientType | null = null;
let oauthClientId = '';
let authenticatedFetch: OAuthSession['fetchHandler'] | null = null;
let account: Account | null = null;

async function getClientId() {
	if (window.location.protocol !== 'https:') {
		const { buildLoopbackClientId } = await import('@atproto/oauth-client-browser');
		const clientId = new URL(buildLoopbackClientId({ hostname: window.location.hostname, port: window.location.port, pathname: '/' }));
		clientId.searchParams.set('scope', OAUTH_SCOPE);
		return clientId.href;
	}
	const url = new URL('/client-metadata.json', window.location.origin);
	const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
	if (!response.ok) throw new Error('OAuth client metadata is unavailable at this address.');
	return url.href;
}

async function activateSession(oauthSession: OAuthSession) {
	const { scope } = await oauthSession.getTokenInfo();
	const grants = scope.split(' ');
	const allowed = [POST_COLLECTION, REPLY_COLLECTION].every((collection) =>
		['create', 'delete'].every((action) => grants.some((grant) => {
			const [resource, query] = grant.split('?');
			const params = new URLSearchParams(query);
			const collections = resource.startsWith('repo:') ? [resource.slice(5)] : resource === 'repo' ? params.getAll('collection') : [];
			const actions = params.getAll('action');
			return collections.includes(collection) && (!actions.length || actions.includes(action));
		}))
	);
	if (!allowed) {
		throw new Error('Reconnect to allow writing Partiii posts and replies.');
	}
	authenticatedFetch = oauthSession.fetchHandler.bind(oauthSession);
	const handle = await getHandle(oauthSession.did).catch(() => oauthSession.did);
	account = { did: oauthSession.did, handle };
	localStorage.setItem('partiii-atproto-did', oauthSession.did);
	return account;
}

let initialization: Promise<Account | null> | undefined;

export function initializeAccount(): Promise<Account | null> {
	return initialization ??= initialize().catch((error) => {
		initialization = undefined;
		throw error;
	});
}

async function initialize() {
	if (!oauthClient) {
		const { BrowserOAuthClient } = await import('@atproto/oauth-client-browser');
		oauthClientId = await getClientId();
		oauthClient = await BrowserOAuthClient.load({ clientId: oauthClientId, handleResolver: 'https://bsky.social' });
	}
	const params = oauthClient.readCallbackParams();
	if (params) {
		const { session } = await oauthClient.initCallback(params);
		await activateSession(session);
	} else {
		const did = localStorage.getItem('partiii-atproto-did');
		if (did) {
			try { await activateSession(await oauthClient.restore(did)); }
			catch (error) {
				localStorage.removeItem('partiii-atproto-did');
				throw error;
			}
		}
	}
	return account;
}

export async function signIn(handle: string) {
	// A failed restore must not prevent starting a fresh authorization.
	try { await initializeAccount(); } catch { if (!oauthClient) throw new Error('Could not load sign-in configuration.'); }
	if (!oauthClient) throw new Error('Sign-in is not available.');
	const input = handle.trim().replace(/^@/, '');
	await oauthClient.signInRedirect(input, { scope: OAUTH_SCOPE });
}

export async function signOut() {
	if (account && oauthClient) await oauthClient.revoke(account.did).catch(() => undefined);
	account = null;
	authenticatedFetch = null;
	localStorage.removeItem('partiii-atproto-did');
	initialization = undefined;
}

export function currentAccount() { return account; }

function requireAgent() {
	if (!authenticatedFetch || !account) throw new Error('Connect an account to post or reply.');
	return { fetchHandler: authenticatedFetch, account };
}

async function writeXrpc<T>(method: string, body: Record<string, unknown>): Promise<T> {
	const { fetchHandler } = requireAgent();
	const response = await fetchHandler(`/xrpc/${method}`, {
		method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body)
	});
	if (!response.ok) throw new Error(`${method} failed (${response.status})`);
	return response.json() as Promise<T>;
}

export async function createPost(text: string, place?: Place) {
	const { account } = requireAgent();
	const createdAt = new Date().toISOString();
	const record = { $type: POST_COLLECTION, text: text.trim(), createdAt, ...(place ? { place: { ...place, latitude: Math.round(place.latitude * 1_000_000), longitude: Math.round(place.longitude * 1_000_000) } } : {}) };
	const saved = await writeXrpc<{ uri: string; cid: string }>('com.atproto.repo.createRecord', { repo: account.did, collection: POST_COLLECTION, record });
	return { ...saved, createdAt };
}

export async function createReply(post: Pick<Post, 'uri' | 'cid'>, text: string) {
	const { account } = requireAgent();
	const createdAt = new Date().toISOString();
	const record = { $type: REPLY_COLLECTION, post: { uri: post.uri, cid: post.cid }, text: text.trim(), createdAt };
	const saved = await writeXrpc<{ uri: string; cid: string }>('com.atproto.repo.createRecord', { repo: account.did, collection: REPLY_COLLECTION, record });
	return { ...saved, createdAt };
}

export async function deleteRecord(uri: string) {
	const { account } = requireAgent();
	if (!uri.startsWith('at://')) throw new Error('This record cannot be deleted here.');
	const [did, collection, rkey] = uri.slice(5).split('/');
	if (did !== account.did || !rkey || ![POST_COLLECTION, REPLY_COLLECTION].includes(collection)) throw new Error('This record cannot be deleted here.');
	return writeXrpc('com.atproto.repo.deleteRecord', { repo: account.did, collection, rkey });
}

type XrpcParams = Record<string, string | number | boolean | undefined>;
async function xrpc<T>(service: string, method: string, params: XrpcParams): Promise<T> {
	const url = new URL(`${service.replace(/\/$/, '')}/xrpc/${method}`);
	for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
	const response = await fetch(url, { headers: { accept: 'application/json' } });
	if (!response.ok) throw new Error(`${method} failed (${response.status})`);
	return response.json() as Promise<T>;
}

async function getDidDocument(did: string) {
	let url: string;
	if (did.startsWith('did:plc:')) url = `https://plc.directory/${encodeURIComponent(did)}`;
	else if (did.startsWith('did:web:')) {
		const [, , authority, ...path] = did.split(':');
		const host = decodeURIComponent(authority);
		url = path.length ? `https://${host}/${path.map(decodeURIComponent).join('/')}/did.json` : `https://${host}/.well-known/did.json`;
	} else throw new Error('Unsupported DID method');
	const response = await fetch(url, { headers: { accept: 'application/json' } });
	if (!response.ok) throw new Error('Could not resolve account identity.');
	return response.json() as Promise<{ alsoKnownAs?: string[]; service?: { id?: string; type?: string; serviceEndpoint?: string }[] }>;
}

async function getPdsAndHandle(did: string) {
	const doc = await getDidDocument(did);
	const pds = doc.service?.find((service) => service.id?.endsWith('#atproto_pds') || /atproto.*pds/i.test(service.type ?? ''))?.serviceEndpoint;
	if (!pds) throw new Error('No personal data server is listed for this account.');
	const handle = doc.alsoKnownAs?.find((value) => value.startsWith('at://'))?.slice(5) ?? did;
	return { pds, handle };
}

export async function getHandle(did: string) {
	return (await getPdsAndHandle(did)).handle;
}

async function reposByCollection(collection: string, cursor?: string, limit = 60) {
	return xrpc<{ repos?: { did: string }[]; cursor?: string }>(PUBLIC_RELAY, 'com.atproto.sync.listReposByCollection', { collection, cursor, limit });
}

async function recordsForDid(did: string, collection: string, limit = 24) {
	const { pds } = await getPdsAndHandle(did);
	const data = await xrpc<{ records?: { uri: string; cid: string; value: Record<string, unknown> }[] }>(pds, 'com.atproto.repo.listRecords', { repo: did, collection, limit, reverse: true });
	return data.records ?? [];
}

async function mapConcurrent<T, R>(values: T[], limit: number, run: (value: T) => Promise<R>): Promise<R[]> {
	const result = new Array<R>(values.length);
	let cursor = 0;
	await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
		while (cursor < values.length) {
			const index = cursor++;
			result[index] = await run(values[index]);
		}
	}));
	return result;
}

export async function loadNetworkPage(cursors: NetworkCursor = {}): Promise<NetworkPage> {
	const [postRepos, replyRepos] = await Promise.all([
		reposByCollection(POST_COLLECTION, cursors.posts),
		reposByCollection(REPLY_COLLECTION, cursors.replies)
	]);
	const dids = [...new Set([...(postRepos.repos ?? []), ...(replyRepos.repos ?? [])].map(({ did }) => did))];
	const perAuthor = await mapConcurrent(dids, 5, async (did) => {
		try {
			const [posts, replies, identity] = await Promise.all([
				recordsForDid(did, POST_COLLECTION),
				recordsForDid(did, REPLY_COLLECTION),
				getPdsAndHandle(did)
			]);
			return { did, handle: identity.handle, posts, replies };
		} catch { return { did, handle: did, posts: [], replies: [] }; }
	});
	const posts: Post[] = [];
	const replies: Reply[] = [];
	for (const author of perAuthor) {
		for (const row of author.posts as { uri: string; cid: string; value: Record<string, unknown> }[]) {
			if (typeof row.value.text !== 'string' || typeof row.value.createdAt !== 'string') continue;
			posts.push({
				uri: row.uri, cid: row.cid, authorDid: author.did, handle: author.handle,
				text: row.value.text, createdAt: row.value.createdAt,
				place: readPlace(row.value.place), replies: []
			});
		}
		for (const row of author.replies as { uri: string; cid: string; value: Record<string, unknown> }[]) {
			const parent = row.value.post as { uri?: string } | undefined;
			if (typeof parent?.uri !== 'string' || typeof row.value.text !== 'string' || typeof row.value.createdAt !== 'string') continue;
			replies.push({ uri: row.uri, cid: row.cid, authorDid: author.did, handle: author.handle, postUri: parent.uri, text: row.value.text, createdAt: row.value.createdAt });
		}
	}
	for (const post of posts) post.replies = replies.filter((reply) => reply.postUri === post.uri).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	return { posts, cursor: { posts: postRepos.cursor, replies: replyRepos.cursor } };
}

export async function loadProfile(did: string) {
	const [{ handle }, posts, replies] = await Promise.all([
		getPdsAndHandle(did), recordsForDid(did, POST_COLLECTION, 100), recordsForDid(did, REPLY_COLLECTION, 100)
	]);
	const replyRows = replies.map((row) => ({ row, parent: row.value.post as { uri?: string } | undefined })).filter(({ row, parent }) => parent?.uri && typeof row.value.text === 'string' && typeof row.value.createdAt === 'string');
	const profilePosts: Post[] = [];
	for (const row of posts) {
		if (typeof row.value.text !== 'string' || typeof row.value.createdAt !== 'string') continue;
		profilePosts.push({ uri: row.uri, cid: row.cid, authorDid: did, handle, text: row.value.text, createdAt: row.value.createdAt, place: readPlace(row.value.place), replies: [] });
	}
	return { did, handle, posts: profilePosts, replies: replyRows };
}

export async function loadPost(uri: string): Promise<Post | null> {
	const [did, collection, rkey] = uri.slice(5).split('/');
	if (!did || !rkey || collection !== POST_COLLECTION || !uri.startsWith('at://')) return null;
	const { pds, handle } = await getPdsAndHandle(did);
	const record = await xrpc<{ uri: string; cid: string; value: Record<string, unknown> }>(pds, 'com.atproto.repo.getRecord', { repo: did, collection, rkey });
	if (typeof record.value.text !== 'string' || typeof record.value.createdAt !== 'string') return null;
	const replyRepos = await reposByCollection(REPLY_COLLECTION).catch(() => ({ repos: [] as { did: string }[] }));
	const replyAuthors = await mapConcurrent([...new Set((replyRepos.repos ?? []).map(({ did }) => did))], 5, async (replyDid) => {
		try {
			const [rows, identity] = await Promise.all([recordsForDid(replyDid, REPLY_COLLECTION), getPdsAndHandle(replyDid)]);
			return rows.flatMap((row) => {
				const parent = row.value.post as { uri?: string } | undefined;
				return parent?.uri === uri && typeof row.value.text === 'string' && typeof row.value.createdAt === 'string'
					? [{ uri: row.uri, cid: row.cid, authorDid: replyDid, handle: identity.handle, postUri: uri, text: row.value.text, createdAt: row.value.createdAt }]
					: [];
			});
		} catch { return [] as Reply[]; }
	});
	return { uri: record.uri, cid: record.cid, authorDid: did, handle, text: record.value.text, createdAt: record.value.createdAt, place: readPlace(record.value.place), replies: replyAuthors.flat().sort((a, b) => a.createdAt.localeCompare(b.createdAt)) };
}

export function approximatePlace(latitude: number, longitude: number, label = ''): Place {
	const grid = 0.25;
	return {
		...(label.trim() ? { label: label.trim().slice(0, 80) } : {}),
		latitude: Math.max(-90, Math.min(90, Math.round(latitude / grid) * grid)),
		longitude: Math.max(-180, Math.min(180, Math.round(longitude / grid) * grid))
	};
}

function readPlace(value: unknown): Place | undefined {
	if (!value || typeof value !== 'object') return;
	const point = value as Record<string, unknown>;
	if (!Number.isInteger(point.latitude) || !Number.isInteger(point.longitude)) return;
	const latitude = Number(point.latitude) / 1_000_000;
	const longitude = Number(point.longitude) / 1_000_000;
	if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
	return { latitude, longitude, ...(typeof point.label === 'string' ? { label: point.label } : {}) };
}
