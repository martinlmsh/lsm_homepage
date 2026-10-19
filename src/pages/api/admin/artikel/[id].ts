export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '../../../../db/client';
import { requireAdmin, unauthorizedResponse } from '../../../../lib/admin-auth';
import { json, jsonError } from '../../../../lib/admin-json';
import {
	deleteArtikel,
	getArtikelById,
	httpErrorStatus,
	updateArtikel,
	type ArtikelInput,
} from '../../../../lib/artikel-admin';

export const GET: APIRoute = async ({ request, params }) => {
	const auth = await requireAdmin(request);
	if (!auth.ok) return unauthorizedResponse(auth);

	const id = params.id;
	if (!id) return jsonError('id fehlt', 400);

	const db = createDb(env.DB);
	const row = await getArtikelById(db, id);
	if (!row) return jsonError('Artikel nicht gefunden', 404);
	return json(row);
};

export const PUT: APIRoute = async ({ request, params }) => {
	const auth = await requireAdmin(request);
	if (!auth.ok) return unauthorizedResponse(auth);

	const id = params.id;
	if (!id) return jsonError('id fehlt', 400);

	let body: Partial<ArtikelInput>;
	try {
		body = (await request.json()) as Partial<ArtikelInput>;
	} catch {
		return jsonError('Ungültiges JSON', 400);
	}

	try {
		const db = createDb(env.DB);
		const updated = await updateArtikel(db, id, body);
		return json(updated);
	} catch (err) {
		const status = httpErrorStatus(err);
		const message = err instanceof Error ? err.message : 'Fehler';
		return jsonError(message, status);
	}
};

export const DELETE: APIRoute = async ({ request, params }) => {
	const auth = await requireAdmin(request);
	if (!auth.ok) return unauthorizedResponse(auth);

	const id = params.id;
	if (!id) return jsonError('id fehlt', 400);

	try {
		const db = createDb(env.DB);
		await deleteArtikel(db, id);
		return json({ ok: true });
	} catch (err) {
		const status = httpErrorStatus(err);
		const message = err instanceof Error ? err.message : 'Fehler';
		return jsonError(message, status);
	}
};
