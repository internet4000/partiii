import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const base = url.origin;
	return new Response(JSON.stringify({
		client_id: `${base}/client-metadata.json`,
		client_name: 'partiii',
		client_uri: base,
		redirect_uris: [`${base}/`],
		response_types: ['code'],
		scope: 'atproto',
		grant_types: ['authorization_code', 'refresh_token'],
		token_endpoint_auth_method: 'none',
		application_type: 'web',
		dpop_bound_access_tokens: true
	}), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
};
