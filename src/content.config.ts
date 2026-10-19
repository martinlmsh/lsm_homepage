import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const leistungen = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/leistungen' }),
	schema: z.object({
		title: z.string(),
		kurztitel: z.string().max(24),
		metaTitle: z.string().max(65),
		metaDescription: z.string().max(155),
		h1: z.string(),
		kurzbeschreibung: z.string(),
		reihenfolge: z.number(),
	}),
});

export const collections = { leistungen };
