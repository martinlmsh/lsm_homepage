import logo from '../assets/logo.svg';
import logoNegativ from '../assets/logo-negativ.svg';

export const siteData = {
	name: 'Lemisch Sanierung & Modernisierung',
	tagline: 'Begleitung für Sanierung & Modernisierung',
	claim: 'Ein Ansprechpartner für Ihr ganzes Haus.',
	phoneDisplay: '0171 1849563',
	phoneHref: 'tel:+491711849563',
	/** Nur serverseitig für Kodierung nutzen – nicht als Klartext ins HTML schreiben. */
	email: 'lemisch.martin@gmail.com',
	/** Ladungsfähige Anschrift – nur im Impressum verwenden, nicht auf Marketingseiten. */
	impressum: {
		inhaber: 'Martin Lemisch',
		street: 'Augustastraße 18',
		zip: '78647',
		city: 'Trossingen',
		/** USt-IdNr. nach § 27a UStG – eintragen, sobald erteilt (leer = ausstehend). */
		ustId: '',
	},
	areas: [
		'Tuttlingen',
		'Trossingen',
		'Villingen-Schwenningen',
		'Rottweil',
		'Balingen',
	] as const,
	logo,
	logoNegativ,
	icon: '/badge.svg',
} as const;

export type Area = (typeof siteData.areas)[number];
