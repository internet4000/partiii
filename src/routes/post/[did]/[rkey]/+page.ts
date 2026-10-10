import { error } from '@sveltejs/kit';
import { POST_COLLECTION } from '$lib/records';
import type { PageLoad } from './$types';
export const load: PageLoad = ({ params }) => {
	if (!/^did:(plc|web):[^/?#\s]+$/.test(params.did) || !/^[A-Za-z0-9._~:-]+$/.test(params.rkey) || ['.', '..'].includes(params.rkey)) error(404);
	return { uri: `at://${params.did}/${POST_COLLECTION}/${params.rkey}` };
};
