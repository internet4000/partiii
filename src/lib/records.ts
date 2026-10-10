export const POST_COLLECTION = 'com.internet4000.partiii.post';
export const REPLY_COLLECTION = 'com.internet4000.partiii.reply';
export const OAUTH_SCOPE = `atproto repo:${POST_COLLECTION}?action=create&action=delete repo:${REPLY_COLLECTION}?action=create&action=delete`;

export function profilePath(did: string) {
	return `/profile/${encodeURIComponent(did)}`;
}

export function postPath(uri: string) {
	const [did, collection, rkey] = uri.replace(/^at:\/\//, '').split('/');
	if (!did || collection !== POST_COLLECTION || !rkey) return '/';
	return `/post/${encodeURIComponent(did)}/${encodeURIComponent(rkey)}`;
}
