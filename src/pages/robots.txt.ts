import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
	const sitemapIndex = new URL('sitemap-index.xml', site);
	const sitemapWissenswertes = new URL('sitemap-wissenswertes.xml', site);
	const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin

Sitemap: ${sitemapIndex.href}
Sitemap: ${sitemapWissenswertes.href}
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
