import { and, count, desc, eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { artikel, artikelWeiterleitungen, bilder, type Artikel } from '../db/schema';
import { PAGE_SIZE } from './artikel';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = new Set(['entwurf', 'veroeffentlicht']);
const QUELLEN = new Set(['editor', 'n8n']);
const MAX_MD = 100_000;

export type ArtikelInput = {
	slug: string;
	titel: string;
	typ: string;
	teaser: string;
	inhaltMd: string;
	titelbildId?: string | null;
	leistung?: string | null;
	ort?: string | null;
	metaTitle: string;
	metaDescription: string;
	status?: string;
	quelle?: string;
};

export type ValidationError = { field?: string; message: string };

function nowIso(): string {
	return new Date().toISOString();
}

function newId(prefix: string): string {
	return `${prefix}-${crypto.randomUUID()}`;
}

export function validateArtikelInput(
	input: Partial<ArtikelInput>,
	{ partial = false }: { partial?: boolean } = {},
): ValidationError[] {
	const errors: ValidationError[] = [];
	const req = (field: keyof ArtikelInput, max?: number) => {
		const value = input[field];
		if (value === undefined || value === null) {
			if (!partial) errors.push({ field, message: `${field} ist erforderlich` });
			return;
		}
		if (typeof value !== 'string' || !value.trim()) {
			errors.push({ field, message: `${field} darf nicht leer sein` });
			return;
		}
		if (max !== undefined && value.length > max) {
			errors.push({ field, message: `${field} max. ${max} Zeichen` });
		}
	};

	if (!partial || input.slug !== undefined) {
		req('slug');
		if (typeof input.slug === 'string' && input.slug && !SLUG_RE.test(input.slug)) {
			errors.push({
				field: 'slug',
				message: 'slug: nur a-z, 0-9 und Bindestriche',
			});
		}
	}
	if (!partial || input.titel !== undefined) req('titel', 200);
	if (!partial || input.typ !== undefined) req('typ', 64);
	if (!partial || input.teaser !== undefined) req('teaser', 500);
	if (!partial || input.inhaltMd !== undefined) {
		req('inhaltMd');
		if (typeof input.inhaltMd === 'string' && input.inhaltMd.length > MAX_MD) {
			errors.push({ field: 'inhaltMd', message: `inhaltMd max. ${MAX_MD} Zeichen` });
		}
	}
	if (!partial || input.metaTitle !== undefined) req('metaTitle', 60);
	if (!partial || input.metaDescription !== undefined) req('metaDescription', 155);

	if (input.status !== undefined && input.status !== null) {
		if (!STATUSES.has(input.status)) {
			errors.push({ field: 'status', message: 'status: entwurf | veroeffentlicht' });
		}
	}
	if (input.quelle !== undefined && input.quelle !== null) {
		if (!QUELLEN.has(input.quelle)) {
			errors.push({ field: 'quelle', message: 'quelle: editor | n8n' });
		}
	}

	return errors;
}

export async function listAdminArtikel(
	db: Db,
	opts: { status?: string; typ?: string; seite?: number } = {},
) {
	const seite = Math.max(1, opts.seite ?? 1);
	const offset = (seite - 1) * PAGE_SIZE;
	const conditions = [];

	if (opts.status && STATUSES.has(opts.status)) {
		conditions.push(eq(artikel.status, opts.status));
	}
	if (opts.typ) {
		conditions.push(eq(artikel.typ, opts.typ));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [totalRow] = await db
		.select({ total: count() })
		.from(artikel)
		.where(where);

	const rows = await db
		.select()
		.from(artikel)
		.where(where)
		.orderBy(desc(artikel.aktualisiertAm))
		.limit(PAGE_SIZE)
		.offset(offset);

	const total = totalRow?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return { rows, total, seite, totalPages };
}

export async function getArtikelById(
	db: Db,
	id: string,
): Promise<(Artikel & { titelbild: typeof bilder.$inferSelect | null }) | null> {
	const rows = await db
		.select({
			artikel,
			titelbild: bilder,
		})
		.from(artikel)
		.leftJoin(bilder, eq(artikel.titelbildId, bilder.id))
		.where(eq(artikel.id, id))
		.limit(1);

	const row = rows[0];
	if (!row) return null;
	return { ...row.artikel, titelbild: row.titelbild };
}

export async function createArtikel(
	db: Db,
	input: ArtikelInput,
): Promise<Artikel> {
	const errors = validateArtikelInput(input);
	if (errors.length) {
		throw Object.assign(new Error(errors.map((e) => e.message).join('; ')), {
			status: 400,
			errors,
		});
	}

	const existing = await db
		.select({ id: artikel.id })
		.from(artikel)
		.where(eq(artikel.slug, input.slug))
		.limit(1);
	if (existing[0]) {
		throw Object.assign(new Error('slug bereits vergeben'), { status: 409 });
	}

	if (input.titelbildId) {
		const bild = await db
			.select({ id: bilder.id })
			.from(bilder)
			.where(eq(bilder.id, input.titelbildId))
			.limit(1);
		if (!bild[0]) {
			throw Object.assign(new Error('titelbildId unbekannt'), { status: 400 });
		}
	}

	const status = input.status && STATUSES.has(input.status) ? input.status : 'entwurf';
	const quelle = input.quelle && QUELLEN.has(input.quelle) ? input.quelle : 'editor';
	const ts = nowIso();

	const row: typeof artikel.$inferInsert = {
		id: newId('artikel'),
		slug: input.slug.trim(),
		titel: input.titel.trim(),
		typ: input.typ.trim(),
		teaser: input.teaser.trim(),
		inhaltMd: input.inhaltMd,
		titelbildId: input.titelbildId ?? null,
		leistung: input.leistung?.trim() || null,
		ort: input.ort?.trim() || null,
		metaTitle: input.metaTitle.trim(),
		metaDescription: input.metaDescription.trim(),
		status,
		quelle,
		veroeffentlichtAm: status === 'veroeffentlicht' ? ts : null,
		aktualisiertAm: ts,
	};

	await db.insert(artikel).values(row);
	await db
		.delete(artikelWeiterleitungen)
		.where(eq(artikelWeiterleitungen.alterSlug, row.slug));
	const created = await getArtikelById(db, row.id);
	if (!created) throw new Error('Artikel nach Insert nicht gefunden');
	return created;
}

export async function updateArtikel(
	db: Db,
	id: string,
	input: Partial<ArtikelInput>,
): Promise<Artikel> {
	const current = await getArtikelById(db, id);
	if (!current) {
		throw Object.assign(new Error('Artikel nicht gefunden'), { status: 404 });
	}

	const errors = validateArtikelInput(input, { partial: true });
	if (errors.length) {
		throw Object.assign(new Error(errors.map((e) => e.message).join('; ')), {
			status: 400,
			errors,
		});
	}

	if (input.slug && input.slug !== current.slug) {
		const clash = await db
			.select({ id: artikel.id })
			.from(artikel)
			.where(eq(artikel.slug, input.slug))
			.limit(1);
		if (clash[0]) {
			throw Object.assign(new Error('slug bereits vergeben'), { status: 409 });
		}
	}

	if (input.titelbildId) {
		const bild = await db
			.select({ id: bilder.id })
			.from(bilder)
			.where(eq(bilder.id, input.titelbildId))
			.limit(1);
		if (!bild[0]) {
			throw Object.assign(new Error('titelbildId unbekannt'), { status: 400 });
		}
	}

	const ts = nowIso();
	const patch: Partial<typeof artikel.$inferInsert> = {
		aktualisiertAm: ts,
	};

	if (input.slug !== undefined) patch.slug = input.slug.trim();
	if (input.titel !== undefined) patch.titel = input.titel.trim();
	if (input.typ !== undefined) patch.typ = input.typ.trim();
	if (input.teaser !== undefined) patch.teaser = input.teaser.trim();
	if (input.inhaltMd !== undefined) patch.inhaltMd = input.inhaltMd;
	if (input.titelbildId !== undefined) patch.titelbildId = input.titelbildId;
	if (input.leistung !== undefined) patch.leistung = input.leistung?.trim() || null;
	if (input.ort !== undefined) patch.ort = input.ort?.trim() || null;
	if (input.metaTitle !== undefined) patch.metaTitle = input.metaTitle.trim();
	if (input.metaDescription !== undefined) {
		patch.metaDescription = input.metaDescription.trim();
	}
	if (input.quelle !== undefined && QUELLEN.has(input.quelle)) {
		patch.quelle = input.quelle;
	}

	await db.update(artikel).set(patch).where(eq(artikel.id, id));

	if (patch.slug && patch.slug !== current.slug) {
		await db
			.delete(artikelWeiterleitungen)
			.where(eq(artikelWeiterleitungen.alterSlug, patch.slug));
		if (current.veroeffentlichtAm) {
			await db
				.insert(artikelWeiterleitungen)
				.values({ alterSlug: current.slug, artikelId: id, erstelltAm: ts })
				.onConflictDoUpdate({
					target: artikelWeiterleitungen.alterSlug,
					set: { artikelId: id, erstelltAm: ts },
				});
		}
	}

	if (input.status !== undefined && STATUSES.has(input.status)) {
		return setArtikelStatus(db, id, input.status);
	}

	const updated = await getArtikelById(db, id);
	if (!updated) throw new Error('Artikel nach Update nicht gefunden');
	return updated;
}

export async function setArtikelStatus(
	db: Db,
	id: string,
	status: string,
): Promise<Artikel> {
	if (!STATUSES.has(status)) {
		throw Object.assign(new Error('status: entwurf | veroeffentlicht'), {
			status: 400,
		});
	}

	const current = await getArtikelById(db, id);
	if (!current) {
		throw Object.assign(new Error('Artikel nicht gefunden'), { status: 404 });
	}

	const ts = nowIso();
	await db
		.update(artikel)
		.set({
			status,
			veroeffentlichtAm:
				status === 'veroeffentlicht'
					? (current.veroeffentlichtAm ?? ts)
					: null,
			aktualisiertAm: ts,
		})
		.where(eq(artikel.id, id));

	const updated = await getArtikelById(db, id);
	if (!updated) throw new Error('Artikel nach Statuswechsel nicht gefunden');
	return updated;
}

export async function deleteArtikel(db: Db, id: string): Promise<void> {
	const current = await getArtikelById(db, id);
	if (!current) {
		throw Object.assign(new Error('Artikel nicht gefunden'), { status: 404 });
	}
	await db.delete(artikelWeiterleitungen).where(eq(artikelWeiterleitungen.artikelId, id));
	await db.delete(artikel).where(eq(artikel.id, id));
}

export function httpErrorStatus(err: unknown): number {
	if (err && typeof err === 'object' && 'status' in err) {
		const s = (err as { status: unknown }).status;
		if (typeof s === 'number') return s;
	}
	return 500;
}
