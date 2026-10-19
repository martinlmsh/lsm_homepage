import type { IconName } from '../components/Icon.astro';

export const vorhabenOptionen = [
	{ value: 'heizung', label: 'Neue Heizung / Wärmepumpe', icon: 'flame' },
	{ value: 'photovoltaik', label: 'Photovoltaik & Speicher', icon: 'sun' },
	{ value: 'trockenbau', label: 'Trockenbau & Malerarbeiten', icon: 'brush' },
	{ value: 'terrasse', label: 'Terrassenüberdachung', icon: 'roof' },
	{ value: 'gelaender', label: 'Geländer & Treppen', icon: 'stairs' },
] as const satisfies readonly { value: string; label: string; icon: IconName }[];

export const wunschOptionen = [
	{
		value: 'angebot',
		label: 'Ich brauche ein Angebot',
		text: 'Ich hole Angebote von geprüften Partnerbetrieben ein.',
		icon: 'document',
	},
	{
		value: 'vergleich',
		label: 'Ich habe schon Angebote',
		text: 'Ich vergleiche sie neutral – und sage Ihnen ehrlich, was taugt.',
		icon: 'scale',
	},
] as const satisfies readonly { value: string; label: string; text: string; icon: IconName }[];

export const zeitpunktOptionen = [
	'So schnell wie möglich',
	'In den nächsten 3 Monaten',
	'In 3–6 Monaten',
	'Ich plane erst mal',
] as const;

export const sorgeOptionen = [
	'Ist der Preis fair?',
	'Fehlt etwas, das später teuer wird?',
	'Ist der Betrieb zuverlässig?',
	'Ich verstehe die Angebote nicht',
] as const;

export const erreichbarkeitOptionen = ['Vormittags', 'Nachmittags'] as const;

/** PLZ-Anfänge im Umkreis von ca. 40 km um Trossingen */
export const plzImGebiet = ['780', '781', '782', '785', '786', '787', '723', '724', '7217'];

/** Vorauswahl im Funnel je nach Leistungsseite */
export const leistungVorauswahl: Record<string, { vorhaben?: string; wunsch?: string }> = {
	waermepumpe: { vorhaben: 'heizung' },
	photovoltaik: { vorhaben: 'photovoltaik' },
	terrassenueberdachung: { vorhaben: 'terrasse' },
	innenausbau: { vorhaben: 'trockenbau' },
	angebotsvergleich: { wunsch: 'vergleich' },
};
