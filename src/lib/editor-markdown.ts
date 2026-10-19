import { marked } from 'marked';
import TurndownService from 'turndown';

const INFO_OPEN = ':::info';
const INFO_CLOSE = ':::';

/** Wandelt :::info-Blöcke in HTML, bevor marked läuft. */
export function infoDirectivesToHtml(markdown: string): string {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const out: string[] = [];
	let inInfo = false;
	let buf: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!inInfo && trimmed === INFO_OPEN) {
			inInfo = true;
			buf = [];
			continue;
		}
		if (inInfo && trimmed === INFO_CLOSE) {
			inInfo = false;
			const innerMd = buf.join('\n').trim() || ' ';
			const innerHtml = marked.parse(innerMd, { async: false }) as string;
			out.push(`<aside class="callout-info" role="note">\n${innerHtml}\n</aside>`);
			buf = [];
			continue;
		}
		if (inInfo) buf.push(line);
		else out.push(line);
	}

	if (inInfo) {
		out.push(INFO_OPEN, ...buf);
	}
	return out.join('\n');
}

/** TipTap-HTML → Markdown inkl. :::info und Bilder. */
export function htmlToMarkdown(html: string): string {
	const td = new TurndownService({
		headingStyle: 'atx',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
		emDelimiter: '*',
		strongDelimiter: '**',
	});

	td.addRule('infoCallout', {
		filter: (node) =>
			node.nodeName === 'ASIDE' &&
			(node as HTMLElement).classList.contains('callout-info'),
		replacement: (_content, node) => {
			const inner = td.turndown((node as HTMLElement).innerHTML).trim();
			return `\n\n${INFO_OPEN}\n${inner}\n${INFO_CLOSE}\n\n`;
		},
	});

	td.addRule('bilderImg', {
		filter: (node) =>
			node.nodeName === 'IMG' &&
			Boolean((node as HTMLImageElement).getAttribute('src')),
		replacement: (_content, node) => {
			const el = node as HTMLImageElement;
			let src = el.getAttribute('src') ?? '';
			const alt = el.getAttribute('alt') ?? '';
			if (src.startsWith('/bilder/') && !src.endsWith('/')) {
				src = `${src}/`;
			}
			return `\n\n![${alt}](${src})\n\n`;
		},
	});

	return td.turndown(html).replace(/\n{3,}/g, '\n\n').trim();
}

/** Markdown → HTML für TipTap setContent. */
export async function markdownToEditorHtml(markdown: string): Promise<string> {
	const withInfo = infoDirectivesToHtml(markdown.trim() || ' ');
	marked.setOptions({ gfm: true, breaks: false });
	const html = await marked.parse(withInfo);
	return typeof html === 'string' ? html : String(html);
}

/** Alle /bilder/…-Pfade aus Markdown extrahieren (ohne trailing slash-Varianten). */
export function extractBildKeys(markdown: string): string[] {
	const keys = new Set<string>();
	const re = /!\[[^\]]*\]\(\s*(\/bilder\/[^)\s]+)\s*\)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(markdown))) {
		let path = m[1].replace(/\/+$/, '');
		const key = path.replace(/^\/bilder\//, '');
		if (key) keys.add(key);
	}
	return [...keys];
}
