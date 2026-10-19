// Erzeugt public/og-default.png (1200×630) aus dem Logo – Vorschaubild für Seiten ohne eigenes Bild.
// Farben entsprechen den Tokens muted und action aus src/styles/global.css.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BREITE = 1200;
const HOEHE = 630;
const LOGO_BREITE = 840;

const logo = await sharp(await readFile(new URL('../src/assets/logo.svg', import.meta.url)), {
	density: 300,
})
	.resize({ width: LOGO_BREITE })
	.png()
	.toBuffer();
const { height: logoHoehe = 0 } = await sharp(logo).metadata();

const balken = Buffer.from(
	`<svg xmlns="http://www.w3.org/2000/svg" width="${BREITE}" height="16"><rect width="100%" height="100%" fill="#d9822b"/></svg>`,
);

await sharp({
	create: { width: BREITE, height: HOEHE, channels: 3, background: '#e9e2d6' },
})
	.composite([
		{
			input: logo,
			left: Math.round((BREITE - LOGO_BREITE) / 2),
			top: Math.round((HOEHE - logoHoehe) / 2),
		},
		{ input: balken, left: 0, top: HOEHE - 16 },
	])
	.png()
	.toFile(fileURLToPath(new URL('../public/og-default.png', import.meta.url)));

console.log('public/og-default.png erzeugt');
