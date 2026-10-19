/** Fehlertolerante Artikelsuche – läuft identisch auf dem Server und im Browser. */

export type SuchDokument = {
	slug: string;
	titel: string;
	teaser: string;
	typ: string;
	typLabel: string;
	datum: string;
	datumText: string;
	titelWoerter: string[];
	teaserWoerter: string[];
	inhaltWoerter: string[];
};

export const MAX_SUCHBEGRIFFE = 5;

const GEWICHT = { titel: 3, teaser: 2, inhalt: 1 } as const;

export function normalisieren(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

export function woerter(text: string): string[] {
	return [...new Set(normalisieren(text).split(' ').filter((wort) => wort.length >= 2))];
}

export function suchbegriffe(eingabe: string | undefined): string[] {
	if (!eingabe) return [];
	return woerter(eingabe).slice(0, MAX_SUCHBEGRIFFE);
}

/** Damerau-Levenshtein (optimal string alignment) mit Abbruch über `max`. */
function distanz(a: string, b: string, max: number): number {
	if (Math.abs(a.length - b.length) > max) return max + 1;
	let vorvorher: number[] = [];
	let vorher = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const aktuell = [i];
		let zeilenMin = i;
		for (let j = 1; j <= b.length; j++) {
			const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
			let wert = Math.min(vorher[j] + 1, aktuell[j - 1] + 1, vorher[j - 1] + kosten);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				wert = Math.min(wert, vorvorher[j - 2] + 1);
			}
			aktuell[j] = wert;
			zeilenMin = Math.min(zeilenMin, wert);
		}
		if (zeilenMin > max) return max + 1;
		vorvorher = vorher;
		vorher = aktuell;
	}
	return vorher[b.length];
}

const erlaubteFehler = (laenge: number) => (laenge <= 3 ? 0 : laenge <= 5 ? 1 : laenge <= 9 ? 2 : 3);

/** Wie gut passt ein Suchbegriff zu einem Wort? 0 = gar nicht, 1 = exakt. */
export function wortTreffer(begriff: string, wort: string, teilwoerter = false): number {
	if (wort === begriff) return 1;
	if (wort.startsWith(begriff)) return 0.9;
	if (begriff.length >= 4 && wort.includes(begriff)) return 0.75;

	const max = erlaubteFehler(begriff.length);
	if (max === 0) return 0;

	const d = distanz(begriff, wort, max);
	if (d <= max) return 0.65 - d * 0.1;

	if (wort.length > begriff.length) {
		for (const laenge of [begriff.length, begriff.length + 1, begriff.length - 1]) {
			if (laenge < 3) continue;
			if (distanz(begriff, wort.slice(0, laenge), max) <= max) return 0.45;
		}
	}

	if (teilwoerter && begriff.length >= 5 && wort.length > begriff.length + 1) {
		const maxTeil = Math.min(max, 2);
		for (const laenge of [begriff.length, begriff.length + 1, begriff.length - 1]) {
			for (let start = 1; start + laenge <= wort.length; start++) {
				if (distanz(begriff, wort.slice(start, start + laenge), maxTeil) <= maxTeil) return 0.4;
			}
		}
	}
	return 0;
}

type Zwischenspeicher = Map<string, number>;

function besterTreffer(
	begriff: string,
	liste: string[],
	teilwoerter: boolean,
	speicher: Zwischenspeicher,
): number {
	let best = 0;
	for (const wort of liste) {
		const schluessel = teilwoerter ? `+${wort}` : wort;
		let treffer = speicher.get(schluessel);
		if (treffer === undefined) {
			treffer = wortTreffer(begriff, wort, teilwoerter);
			speicher.set(schluessel, treffer);
		}
		if (treffer > best) best = treffer;
		if (best === 1) break;
	}
	return best;
}

const SICHERER_TREFFER = 0.75;

function begriffPunkte(
	dokument: SuchDokument,
	begriff: string,
	nurSicher: boolean,
	speicher: Zwischenspeicher,
): number {
	const felder = [
		[dokument.titelWoerter, GEWICHT.titel, true],
		[dokument.teaserWoerter, GEWICHT.teaser, true],
		[dokument.inhaltWoerter, GEWICHT.inhalt, false],
	] as const;
	let best = 0;
	for (const [liste, gewicht, teilwoerter] of felder) {
		const treffer = besterTreffer(begriff, liste, teilwoerter, speicher);
		if (nurSicher && treffer < SICHERER_TREFFER) continue;
		best = Math.max(best, treffer * gewicht);
	}
	return best;
}

/**
 * Tippfehler-Treffer zählen nur, wenn ein Begriff nirgends sicher gefunden wird –
 * sonst würde z. B. „dach“ auch jeden Artikel mit „nach“ liefern.
 */
export type Suchergebnis = {
	treffer: SuchDokument[];
	/** Je Suchbegriff die Mindestgüte, ab der ein Wort als Treffer gilt (für die Markierung). */
	schwellen: number[];
};

export function suchen(dokumente: SuchDokument[], begriffe: string[]): Suchergebnis {
	if (begriffe.length === 0) return { treffer: dokumente, schwellen: [] };

	const speicher = begriffe.map((): Zwischenspeicher => new Map());
	const nurSicher = begriffe.map((begriff, i) =>
		dokumente.some((dokument) => begriffPunkte(dokument, begriff, true, speicher[i]) > 0),
	);
	const schwellen = nurSicher.map((sicher) => (sicher ? SICHERER_TREFFER : Number.MIN_VALUE));

	const treffer = dokumente
		.map((dokument) => {
			let punkte = 0;
			for (const [index, begriff] of begriffe.entries()) {
				const p = begriffPunkte(dokument, begriff, nurSicher[index], speicher[index]);
				if (p === 0) return { dokument, punkte: 0 };
				punkte += p;
			}
			return { dokument, punkte };
		})
		.filter((eintrag) => eintrag.punkte > 0)
		.sort((a, b) => b.punkte - a.punkte || b.dokument.datum.localeCompare(a.dokument.datum))
		.map((eintrag) => eintrag.dokument);

	return { treffer, schwellen };
}

/** Zerlegt Text in Abschnitte und markiert Wörter, die zu einem Suchbegriff passen. */
export function markieren(
	text: string,
	begriffe: string[],
	schwellen: number[],
): { text: string; treffer: boolean }[] {
	if (begriffe.length === 0) return [{ text, treffer: false }];
	const teile: { text: string; treffer: boolean }[] = [];
	let letzterIndex = 0;
	for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) {
		const index = match.index ?? 0;
		const wort = normalisieren(match[0]);
		if (begriffe.some((begriff, i) => wortTreffer(begriff, wort, true) >= (schwellen[i] ?? 1))) {
			if (index > letzterIndex) teile.push({ text: text.slice(letzterIndex, index), treffer: false });
			teile.push({ text: match[0], treffer: true });
			letzterIndex = index + match[0].length;
		}
	}
	if (letzterIndex < text.length) teile.push({ text: text.slice(letzterIndex), treffer: false });
	return teile;
}
