import { desc, eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { bilder, type Bild } from '../db/schema';

const ALLOWED_TYPES: Record<string, string> = {
	'image/webp': 'webp',
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/avif': 'avif',
};

const MAX_BYTES = 8 * 1024 * 1024;

function nowIso(): string {
	return new Date().toISOString();
}

function slugifyName(name: string): string {
	return name
		.toLowerCase()
		.replace(/\.[^.]+$/, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60) || 'bild';
}

export async function listBilder(db: Db, limit = 100): Promise<Bild[]> {
	return db
		.select()
		.from(bilder)
		.orderBy(desc(bilder.erstelltAm))
		.limit(Math.min(200, Math.max(1, limit)));
}

export async function getBildById(db: Db, id: string): Promise<Bild | null> {
	const rows = await db.select().from(bilder).where(eq(bilder.id, id)).limit(1);
	return rows[0] ?? null;
}

export async function uploadBild(
	db: Db,
	bucket: R2Bucket,
	file: File,
	alt: string,
): Promise<Bild> {
	if (!alt?.trim()) {
		throw Object.assign(new Error('alt ist erforderlich'), { status: 400 });
	}
	if (file.size <= 0 || file.size > MAX_BYTES) {
		throw Object.assign(
			new Error(`Datei max. ${MAX_BYTES / (1024 * 1024)} MB`),
			{ status: 400 },
		);
	}

	const ext = ALLOWED_TYPES[file.type];
	if (!ext) {
		throw Object.assign(
			new Error('Erlaubt: webp, png, jpeg, gif, avif'),
			{ status: 400 },
		);
	}

	const id = `bild-${crypto.randomUUID()}`;
	const folder = new Date().toISOString().slice(0, 7);
	const r2Key = `${folder}/${slugifyName(file.name)}-${id.slice(0, 8)}.${ext}`;

	const buffer = await file.arrayBuffer();
	await bucket.put(r2Key, buffer, {
		httpMetadata: { contentType: file.type },
		customMetadata: { alt: alt.trim(), bildId: id },
	});

	const row: typeof bilder.$inferInsert = {
		id,
		r2Key,
		alt: alt.trim(),
		breite: null,
		hoehe: null,
		bytes: file.size,
		erstelltAm: nowIso(),
	};

	await db.insert(bilder).values(row);
	return row as Bild;
}

export async function deleteBild(
	db: Db,
	bucket: R2Bucket,
	id: string,
): Promise<void> {
	const bild = await getBildById(db, id);
	if (!bild) {
		throw Object.assign(new Error('Bild nicht gefunden'), { status: 404 });
	}
	await bucket.delete(bild.r2Key);
	await db.delete(bilder).where(eq(bilder.id, id));
}
