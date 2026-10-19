function decodeContact(encoded: string): { href: string; label: string } | null {
	try {
		let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
		const pad = b64.length % 4;
		if (pad) b64 += '='.repeat(4 - pad);
		const binary = atob(b64);
		const reversed = [...binary].reverse().join('');
		const data = JSON.parse(reversed) as { href?: string; label?: string };
		if (typeof data.href !== 'string' || typeof data.label !== 'string') return null;
		return { href: data.href, label: data.label };
	} catch {
		return null;
	}
}

function revealContacts() {
	document.querySelectorAll<HTMLAnchorElement>('a[data-contact]').forEach((link) => {
		const encoded = link.dataset.contact;
		if (!encoded) return;
		const decoded = decodeContact(encoded);
		if (!decoded) return;

		link.href = decoded.href;
		link.removeAttribute('data-contact');

		const labelEl = link.querySelector<HTMLElement>('[data-contact-label]');
		const injectEl = link.querySelector<HTMLElement>('[data-contact-inject]');
		if (labelEl) {
			labelEl.textContent = decoded.label;
		} else if (injectEl) {
			injectEl.textContent = decoded.label;
		} else if (!link.querySelector('[data-contact-keep]')) {
			link.textContent = decoded.label;
		}
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', revealContacts);
} else {
	revealContacts();
}
