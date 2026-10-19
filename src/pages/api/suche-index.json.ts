export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '../../db/client';
import { listSuchDokumente } from '../../lib/artikel';

export const GET: APIRoute = async () => {
	const dokumente = await listSuchDokumente(createDb(env.DB));

	return new Response(JSON.stringify(dokumente), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=60, s-maxage=300',
			'X-Robots-Tag': 'noindex',
		},
	});
};
