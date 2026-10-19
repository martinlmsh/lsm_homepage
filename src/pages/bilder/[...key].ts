export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const EXT_TYPES: Record<string, string> = {
	webp: 'image/webp',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	svg: 'image/svg+xml',
	avif: 'image/avif',
};

function contentTypeForKey(key: string, httpMetadata?: R2HTTPMetadata): string {
	if (httpMetadata?.contentType) return httpMetadata.contentType;
	const ext = key.split('.').pop()?.toLowerCase() ?? '';
	return EXT_TYPES[ext] ?? 'application/octet-stream';
}

export const GET: APIRoute = async ({ params }) => {
	const raw = params.key;
	const key = (Array.isArray(raw) ? raw.join('/') : (raw ?? '')).replace(
		/\/+$/,
		'',
	);

	if (!key || key.includes('..')) {
		return new Response('Not found', { status: 404 });
	}

	const object = await env.BILDER.get(key);
	if (!object) {
		return new Response('Not found', { status: 404 });
	}

	const headers = new Headers();
	headers.set(
		'Content-Type',
		contentTypeForKey(key, object.httpMetadata),
	);
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	if (object.httpEtag) {
		headers.set('ETag', object.httpEtag);
	}

	return new Response(object.body, { headers });
};
