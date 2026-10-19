import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

export type ImageMeta = {
	src: string;
	alt?: string;
	breite?: number | null;
	hoehe?: number | null;
};

/** Baut ImageMeta-Einträge für /bilder/…-Keys (mit und ohne trailing slash). */
export function bilderAlsImageMetas(
	rows: Array<{
		r2Key: string;
		alt: string;
		breite?: number | null;
		hoehe?: number | null;
	}>,
): ImageMeta[] {
	const out: ImageMeta[] = [];
	for (const row of rows) {
		const base = `/bilder/${row.r2Key}`;
		const meta = {
			alt: row.alt,
			breite: row.breite,
			hoehe: row.hoehe,
		};
		out.push({ src: base, ...meta });
		out.push({ src: `${base}/`, ...meta });
	}
	return out;
}

function remarkInfoCallout() {
	return (tree: unknown) => {
		visit(tree as never, (node: Record<string, unknown>) => {
			if (node.type === 'containerDirective' && node.name === 'info') {
				const data = (node.data as Record<string, unknown>) ?? {};
				node.data = data;
				data.hName = 'aside';
				data.hProperties = {
					className: ['callout-info'],
					role: 'note',
				};
			}
		});
	};
}

/** Die Seite stellt die H1 (Artikeltitel) – Überschriften im Inhalt beginnen bei H2. */
function remarkUeberschriftenAbH2() {
	return (tree: unknown) => {
		const headings: { depth: number }[] = [];
		visit(tree as never, 'heading', (node: { depth: number }) => {
			headings.push(node);
		});
		if (!headings.some((h) => h.depth === 1)) return;
		for (const h of headings) h.depth = Math.min(h.depth + 1, 6);
	};
}

function rehypeImageAttrs(images: ImageMeta[]) {
	const bySrc = new Map(images.map((img) => [img.src, img]));

	return (tree: unknown) => {
		visit(tree as never, 'element', (node: {
			tagName?: string;
			properties?: Record<string, unknown>;
		}) => {
			if (node.tagName !== 'img') return;
			let src = String(node.properties?.src ?? '');
			if (src.startsWith('/bilder/') && !src.endsWith('/')) {
				src = `${src}/`;
				node.properties = { ...node.properties, src };
			}
			const meta =
				bySrc.get(src) ??
				bySrc.get(src.replace(/\/$/, '')) ??
				bySrc.get(`${src}/`);
			node.properties = {
				...node.properties,
				loading: 'lazy',
				decoding: 'async',
			};
			if (meta?.breite) node.properties.width = meta.breite;
			if (meta?.hoehe) node.properties.height = meta.hoehe;
			if (meta?.alt && !node.properties.alt) {
				node.properties.alt = meta.alt;
			}
		});
	};
}

const sanitizeSchema = {
	...defaultSchema,
	tagNames: [...(defaultSchema.tagNames ?? []), 'aside'],
	attributes: {
		...defaultSchema.attributes,
		aside: ['className', 'class', 'role'],
		img: [
			...(defaultSchema.attributes?.img ?? []),
			'loading',
			'decoding',
			'width',
			'height',
		],
	},
};

export async function renderMarkdown(
	markdown: string,
	options: { images?: ImageMeta[] } = {},
): Promise<string> {
	const images = options.images ?? [];

	const file = await unified()
		.use(remarkParse)
		.use(remarkDirective)
		.use(remarkInfoCallout)
		.use(remarkUeberschriftenAbH2)
		.use(remarkRehype)
		.use(() => rehypeImageAttrs(images))
		.use(rehypeSanitize, sanitizeSchema)
		.use(rehypeStringify)
		.process(markdown);

	return String(file);
}
