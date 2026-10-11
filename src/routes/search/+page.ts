import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const query = url.searchParams.get('q')?.trim();
	redirect(308, query ? `/?q=${encodeURIComponent(query)}` : '/');
};
