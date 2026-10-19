import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const bilder = sqliteTable('bilder', {
	id: text('id').primaryKey(),
	r2Key: text('r2_key').notNull().unique(),
	alt: text('alt').notNull(),
	breite: integer('breite'),
	hoehe: integer('hoehe'),
	bytes: integer('bytes'),
	erstelltAm: text('erstellt_am').notNull(),
});

export const artikel = sqliteTable('artikel', {
	id: text('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	titel: text('titel').notNull(),
	/** Freitext-Typ (z. B. blogartikel, projektbericht) – keine DB-Enum, erweiterbar */
	typ: text('typ').notNull(),
	teaser: text('teaser').notNull(),
	inhaltMd: text('inhalt_md').notNull(),
	titelbildId: text('titelbild_id').references(() => bilder.id),
	leistung: text('leistung'),
	ort: text('ort'),
	metaTitle: text('meta_title').notNull(),
	metaDescription: text('meta_description').notNull(),
	status: text('status').notNull(), // entwurf | veroeffentlicht
	quelle: text('quelle').notNull(), // editor | n8n
	veroeffentlichtAm: text('veroeffentlicht_am'),
	aktualisiertAm: text('aktualisiert_am').notNull(),
});

/** Frühere Slugs veröffentlichter Artikel → 301 auf den aktuellen Slug */
export const artikelWeiterleitungen = sqliteTable('artikel_weiterleitungen', {
	alterSlug: text('alter_slug').primaryKey(),
	artikelId: text('artikel_id')
		.notNull()
		.references(() => artikel.id, { onDelete: 'cascade' }),
	erstelltAm: text('erstellt_am').notNull(),
});

export type Bild = typeof bilder.$inferSelect;
export type Artikel = typeof artikel.$inferSelect;
