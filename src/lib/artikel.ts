import { and, count, desc, eq, ne, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { artikel, artikelWeiterleitungen, bilder, type Artikel, type Bild } from '../db/schema';
import { woerter, type SuchDokument } from './suche';

export const PAGE_SIZE = 10;

export const TYP_LABELS: Record<string, string> = {
	blogartikel: 'Blogartikel',
	projektbericht: 'Projektbericht',
};

export function typLabel(typ: string): string {
	return TYP_LABELS[typ] ?? typ;
}

export function formatDatum(iso: string | null) {
	if (!iso) return '';
	return new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	}).format(new Date(iso));
}

/** Alle veröffentlichten Artikel als Suchindex (Wörter vorab normalisiert). */
export async function listSuchDokumente(db: Db): Promise<SuchDokument[]> {
	const rows = await db
		.select({
			slug: artikel.slug,
			titel: artikel.titel,
			teaser: artikel.teaser,
			typ: artikel.typ,
			inhaltMd: artikel.inhaltMd,
			ort: artikel.ort,
			leistung: artikel.leistung,
			veroeffentlichtAm: artikel.veroeffentlichtAm,
		})
		.from(artikel)
		.where(eq(artikel.status, 'veroeffentlicht'))
		.orderBy(desc(artikel.veroeffentlichtAm));

	return rows.map((row) => ({
		slug: row.slug,
		titel: row.titel,
		teaser: row.teaser,
		typ: row.typ,
		typLabel: typLabel(row.typ),
		datum: row.veroeffentlichtAm ?? '',
		datumText: formatDatum(row.veroeffentlichtAm),
		titelWoerter: woerter(row.titel),
		teaserWoerter: woerter(row.teaser),
		inhaltWoerter: woerter([row.inhaltMd, row.ort ?? '', row.leistung ?? ''].join(' ')),
	}));
}

export async function listPublishedArtikel(
	db: Db,
	opts: { typ?: string; seite?: number } = {},
) {
	const seite = Math.max(1, opts.seite ?? 1);
	const offset = (seite - 1) * PAGE_SIZE;

	const conditions = [eq(artikel.status, 'veroeffentlicht')];
	if (opts.typ) {
		conditions.push(eq(artikel.typ, opts.typ));
	}

	const where = and(...conditions);

	const [totalRow] = await db
		.select({ total: count() })
		.from(artikel)
		.where(where);

	const rows = await db
		.select()
		.from(artikel)
		.where(where)
		.orderBy(desc(artikel.veroeffentlichtAm))
		.limit(PAGE_SIZE)
		.offset(offset);

	const total = totalRow?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return { rows, total, seite, totalPages };
}

export async function getPublishedArtikelBySlug(
	db: Db,
	slug: string,
): Promise<(Artikel & { titelbild: Bild | null }) | null> {
	const rows = await db
		.select({
			artikel,
			titelbild: bilder,
		})
		.from(artikel)
		.leftJoin(bilder, eq(artikel.titelbildId, bilder.id))
		.where(
			and(eq(artikel.slug, slug), eq(artikel.status, 'veroeffentlicht')),
		)
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	return {
		...row.artikel,
		titelbild: row.titelbild,
	};
}

/** Aktueller Slug eines veröffentlichten Artikels, der früher unter `alterSlug` erreichbar war. */
export async function getWeiterleitungsSlug(db: Db, alterSlug: string): Promise<string | null> {
	const rows = await db
		.select({ slug: artikel.slug })
		.from(artikelWeiterleitungen)
		.innerJoin(artikel, eq(artikelWeiterleitungen.artikelId, artikel.id))
		.where(
			and(
				eq(artikelWeiterleitungen.alterSlug, alterSlug),
				eq(artikel.status, 'veroeffentlicht'),
			),
		)
		.limit(1);
	return rows[0]?.slug ?? null;
}

export type ArtikelKarte = {
	slug: string;
	titel: string;
	teaser: string;
	typ: string;
	veroeffentlichtAm: string | null;
};

const kartenFelder = {
	slug: artikel.slug,
	titel: artikel.titel,
	teaser: artikel.teaser,
	typ: artikel.typ,
	veroeffentlichtAm: artikel.veroeffentlichtAm,
	leistung: artikel.leistung,
};

/** Weitere Artikel: gleiche Leistung zuerst, dann gleicher Typ, sonst die neuesten. */
export async function listVerwandteArtikel(
	db: Db,
	aktuell: { slug: string; leistung: string | null; typ: string },
	limit = 3,
): Promise<ArtikelKarte[]> {
	const rows = await db
		.select(kartenFelder)
		.from(artikel)
		.where(and(eq(artikel.status, 'veroeffentlicht'), ne(artikel.slug, aktuell.slug)))
		.orderBy(desc(artikel.veroeffentlichtAm))
		.limit(50);

	const punkte = (row: (typeof rows)[number]) =>
		(aktuell.leistung && row.leistung === aktuell.leistung ? 2 : 0) +
		(row.typ === aktuell.typ ? 1 : 0);

	return rows
		.map((row, index) => ({ row, index, punkte: punkte(row) }))
		.sort((a, b) => b.punkte - a.punkte || a.index - b.index)
		.slice(0, limit)
		.map(({ row: { leistung: _leistung, ...karte } }) => karte);
}

export async function listArtikelZuLeistung(
	db: Db,
	leistung: string,
	limit = 3,
): Promise<ArtikelKarte[]> {
	const rows = await db
		.select(kartenFelder)
		.from(artikel)
		.where(and(eq(artikel.status, 'veroeffentlicht'), eq(artikel.leistung, leistung)))
		.orderBy(desc(artikel.veroeffentlichtAm))
		.limit(limit);
	return rows.map(({ leistung: _leistung, ...karte }) => karte);
}

export async function listPublishedForSitemap(db: Db) {
	return db
		.select({
			slug: artikel.slug,
			veroeffentlichtAm: artikel.veroeffentlichtAm,
			aktualisiertAm: artikel.aktualisiertAm,
		})
		.from(artikel)
		.where(eq(artikel.status, 'veroeffentlicht'))
		.orderBy(desc(artikel.veroeffentlichtAm));
}

export async function listDistinctPublishedTypen(db: Db): Promise<string[]> {
	const rows = await db
		.selectDistinct({ typ: artikel.typ })
		.from(artikel)
		.where(eq(artikel.status, 'veroeffentlicht'))
		.orderBy(sql`${artikel.typ} asc`);

	return rows.map((r) => r.typ);
}

export async function getBilderByR2Keys(db: Db, keys: string[]) {
	if (keys.length === 0) return [];
	const rows = await db.select().from(bilder);
	const keySet = new Set(keys);
	return rows.filter((b) => keySet.has(b.r2Key) || keySet.has(`/bilder/${b.r2Key}`));
}
