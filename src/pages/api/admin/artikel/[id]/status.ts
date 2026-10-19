export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '../../../../../db/client';
import { requireAdmin, unauthorizedResponse } from '../../../../../lib/admin-auth';
import { json, jsonError } from '../../../../../lib/admin-json';
import { httpErrorStatus, setArtikelStatus } from '../../../../../lib/artikel-admin';

export const PATCH: APIRoute = async ({ request, params }) => {
	const auth = await requireAdmin(request);
	if (!auth.ok) return unauthorizedResponse(auth);

	const id = params.id;
	if (!id) return jsonError('id fehlt', 400);

	let body: { status?: string };
	try {
		body = (await request.json()) as { status?: string };
	} catch {
		return jsonError('Ungültiges JSON', 400);
	}

	if (!body.status) return jsonError('status ist erforderlich', 400);

	try {
		const db = createDb(env.DB);
		const updated = await setArtikelStatus(db, id, body.status);
		return json(updated);
	} catch (err) {
		const status = httpErrorStatus(err);
		const message = err instanceof Error ? err.message : 'Fehler';
		return jsonError(message, status);
	}
};
