type Ort = {
	name: string;
	lat: number;
	lon: number;
	haupt?: boolean;
	label: 'links' | 'rechts' | 'unten';
};

export const einzugsgebiet = {
	mitte: { name: 'Trossingen', lat: 48.0756, lon: 8.6366 },
	radiusKm: 40,
	orte: [
		{ name: 'Tuttlingen', lat: 47.9844, lon: 8.817, haupt: true, label: 'rechts' },
		{ name: 'Villingen-Schwenningen', lat: 48.0603, lon: 8.4586, haupt: true, label: 'links' },
		{ name: 'Rottweil', lat: 48.1681, lon: 8.6247, haupt: true, label: 'rechts' },
		{ name: 'Balingen', lat: 48.2753, lon: 8.854, haupt: true, label: 'rechts' },
		{ name: 'Spaichingen', lat: 48.0758, lon: 8.7347, label: 'rechts' },
		{ name: 'Donaueschingen', lat: 47.953, lon: 8.503, label: 'links' },
		{ name: 'Schramberg', lat: 48.226, lon: 8.385, label: 'links' },
		{ name: 'Oberndorf', lat: 48.29, lon: 8.572, label: 'links' },
		{ name: 'Albstadt', lat: 48.211, lon: 9.024, label: 'rechts' },
		{ name: 'Hechingen', lat: 48.351, lon: 8.963, label: 'rechts' },
		{ name: 'Blumberg', lat: 47.84, lon: 8.533, label: 'rechts' },
	] satisfies Ort[],
};
