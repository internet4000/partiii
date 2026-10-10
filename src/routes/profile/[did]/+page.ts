import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
export const load: PageLoad = ({ params }) => {
	if (!/^did:(plc|web):[^/?#\s]+$/.test(params.did)) error(404);
	return { did: params.did };
};
