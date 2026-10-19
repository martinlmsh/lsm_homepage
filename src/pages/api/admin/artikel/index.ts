export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '../../../../db/client';
import { requireAdmin, unauthorizedResponse } from '../../../../lib/admin-auth';
import { json, jsonError } from '../../../../lib/admin-json';
import {
	createArtikel,
	httpErrorStatus,
	listAdminArtikel,
	type ArtikelInput,
} from '../../../../lib/artikel-admin';

export const GET: APIRoute = async ({ request, url }) => {
	const auth = await requireAdmin(request);
	if (!auth.ok) return unauthorizedResponse(auth);

	const status = url.searchParams.get('status') ?? undefined;
	const typ = url.searchParams.get('typ') ?? undefined;
	const seite = Number(url.searchParams.get('seite') ?? '1') || 1;

	const db = createDb(env.DB);
	const result = await listAdminArtikel(db, { status, typ, seite });
	return json(result);
};

export const POST: APIRoute = async ({ request }) => {
	const auth = await requireAdmin(request);
	if (!auth.ok) return unauthorizedResponse(auth);

	let body: Partial<ArtikelInput>;
	try {
		body = (await request.json()) as Partial<ArtikelInput>;
	} catch {
		return jsonError('Ungültiges JSON', 400);
	}

	try {
		const db = createDb(env.DB);
		const created = await createArtikel(db, body as ArtikelInput);
		return json(created, 201);
	} catch (err) {
		const status = httpErrorStatus(err);
		const message = err instanceof Error ? err.message : 'Fehler';
		return jsonError(message, status);
	}
};
