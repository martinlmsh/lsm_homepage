export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '../../../../db/client';
import { requireAdmin, unauthorizedResponse } from '../../../../lib/admin-auth';
import { json, jsonError } from '../../../../lib/admin-json';
import { httpErrorStatus } from '../../../../lib/artikel-admin';
import { listBilder, uploadBild } from '../../../../lib/bilder-admin';

export const GET: APIRoute = async ({ request, url }) => {
	const auth = await requireAdmin(request);
	if (!auth.ok) return unauthorizedResponse(auth);

	const limit = Number(url.searchParams.get('limit') ?? '100') || 100;
	const db = createDb(env.DB);
	const rows = await listBilder(db, limit);
	return json({ rows });
};

export const POST: APIRoute = async ({ request }) => {
	const auth = await requireAdmin(request);
	if (!auth.ok) return unauthorizedResponse(auth);

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return jsonError('multipart/form-data erwartet', 400);
	}

	const file = form.get('file');
	const alt = form.get('alt');

	if (!(file instanceof File)) {
		return jsonError('file ist erforderlich', 400);
	}
	if (typeof alt !== 'string') {
		return jsonError('alt ist erforderlich', 400);
	}

	try {
		const db = createDb(env.DB);
		const created = await uploadBild(db, env.BILDER, file, alt);
		return json(
			{
				...created,
				url: `/bilder/${created.r2Key}`,
			},
			201,
		);
	} catch (err) {
		const status = httpErrorStatus(err);
		const message = err instanceof Error ? err.message : 'Fehler';
		return jsonError(message, status);
	}
};
