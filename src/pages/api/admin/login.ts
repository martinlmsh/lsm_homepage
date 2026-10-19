export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { DEV_COOKIE } from '../../../lib/admin-auth';
import { json, jsonError } from '../../../lib/admin-json';

type AuthEnv = { ADMIN_DEV_TOKEN?: string };

export const POST: APIRoute = async ({ request }) => {
	const adminToken = (env as typeof env & AuthEnv).ADMIN_DEV_TOKEN;
	if (!adminToken) {
		return jsonError(
			'Lokaler Login nur mit ADMIN_DEV_TOKEN (Access übernimmt Produktion)',
			503,
		);
	}

	let body: { token?: string };
	try {
		body = (await request.json()) as { token?: string };
	} catch {
		return jsonError('Ungültiges JSON', 400);
	}

	if (!body.token || body.token !== adminToken) {
		return jsonError('Token ungültig', 401);
	}

	const secure = new URL(request.url).protocol === 'https:';
	const cookie = [
		`${DEV_COOKIE}=${encodeURIComponent(body.token)}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Strict',
		'Max-Age=604800',
		secure ? 'Secure' : '',
	]
		.filter(Boolean)
		.join('; ');

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			'Set-Cookie': cookie,
		},
	});
};

export const DELETE: APIRoute = async ({ request }) => {
	const secure = new URL(request.url).protocol === 'https:';
	const cookie = [
		`${DEV_COOKIE}=`,
		'Path=/',
		'HttpOnly',
		'SameSite=Strict',
		'Max-Age=0',
		secure ? 'Secure' : '',
	]
		.filter(Boolean)
		.join('; ');

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			'Set-Cookie': cookie,
		},
	});
};
