/** Server-seitige Kodierung – Klartext landet nicht im HTML. */
export function encodeContactPayload(href: string, label: string): string {
	const payload = JSON.stringify({ href, label });
	const reversed = [...payload].reverse().join('');
	return Buffer.from(reversed, 'utf8').toString('base64url');
}

export function phonePayload(phoneE164: string, display: string): string {
	return encodeContactPayload(`tel:${phoneE164}`, display);
}

export function emailPayload(email: string): string {
	return encodeContactPayload(`mailto:${email}`, email);
}
