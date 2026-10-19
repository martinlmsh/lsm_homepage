import type { AstroGlobal } from 'astro';
import { requireAdmin, type AdminAuthResult } from './admin-auth';

export async function gateAdmin(
	astro: AstroGlobal,
): Promise<Extract<AdminAuthResult, { ok: true }> | Response> {
	const auth = await requireAdmin(astro.request);
	if (!auth.ok) {
		return astro.redirect('/admin/login/');
	}
	return auth;
}
