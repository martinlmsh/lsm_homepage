export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createDb } from '../db/client';
import { listPublishedForSitemap } from '../lib/artikel';

export const GET: APIRoute = async ({ site }) => {
	const db = createDb(env.DB);
	const rows = await listPublishedForSitemap(db);
	const origin = site?.href.replace(/\/$/, '') ?? 'https://example.com';

	const eintraege = rows.map((row) => ({
		loc: `${origin}/wissenswertes/${row.slug}/`,
		lastmod: row.aktualisiertAm || row.veroeffentlichtAm || '',
	}));
	const neuestes = eintraege
		.map((e) => e.lastmod)
		.sort()
		.at(-1);

	const urls = [{ loc: `${origin}/wissenswertes/`, lastmod: neuestes ?? '' }, ...eintraege]
		.map(
			({ loc, lastmod }) => `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}
  </url>`,
		)
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, s-maxage=300',
		},
	});
};
