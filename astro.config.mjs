// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
// TODO: Domain in SITE_URL setzen, sobald sie feststeht
const site = env.SITE_URL || 'https://example.com';

// https://astro.build/config
export default defineConfig({
	site,
	// ignore: Seiten nutzen weiter Trailing Slashes; /bilder/<key> ohne Slash muss matchen
	trailingSlash: 'ignore',
	session: false,
	build: {
		format: 'directory',
	},
	adapter: cloudflare({
		imageService: 'passthrough',
	}),
	integrations: [
		sitemap({
			filter: (page) =>
				!page.includes('/impressum/') &&
				!page.includes('/datenschutz/') &&
				!page.includes('/404') &&
				!page.includes('/danke/') &&
				!page.includes('/wissenswertes/') &&
				!page.includes('/bilder/'),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
