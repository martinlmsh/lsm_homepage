import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from 'cloudflare:workers';

export type AdminAuthResult =
	| { ok: true; via: 'access' | 'dev'; email?: string }
	| { ok: false; status: 401 | 503; message: string };

type AuthEnv = {
	CF_ACCESS_TEAM_DOMAIN?: string;
	CF_ACCESS_AUD?: string;
	ADMIN_DEV_TOKEN?: string;
};

function getAuthEnv(): AuthEnv {
	const e = env as typeof env & AuthEnv;
	return {
		CF_ACCESS_TEAM_DOMAIN: e.CF_ACCESS_TEAM_DOMAIN,
		CF_ACCESS_AUD: e.CF_ACCESS_AUD,
		ADMIN_DEV_TOKEN: e.ADMIN_DEV_TOKEN,
	};
}

export const DEV_COOKIE = 'lsm_admin_token';

function bearerToken(request: Request): string | null {
	const header = request.headers.get('Authorization');
	if (!header?.startsWith('Bearer ')) return null;
	return header.slice('Bearer '.length).trim() || null;
}

function cookieToken(request: Request): string | null {
	const raw = request.headers.get('Cookie');
	if (!raw) return null;
	for (const part of raw.split(';')) {
		const [k, ...rest] = part.trim().split('=');
		if (k === DEV_COOKIE) {
			return decodeURIComponent(rest.join('=').trim()) || null;
		}
	}
	return null;
}

async function verifyAccessJwt(
	token: string,
	teamDomain: string,
	aud: string,
): Promise<{ email?: string } | null> {
	const issuer = `https://${teamDomain}`;
	const JWKS = createRemoteJWKSet(
		new URL(`${issuer}/cdn-cgi/access/certs`),
	);

	try {
		const { payload } = await jwtVerify(token, JWKS, {
			issuer,
			audience: aud,
		});
		const email =
			typeof payload.email === 'string'
				? payload.email
				: typeof payload.common_name === 'string'
					? payload.common_name
					: undefined;
		return { email };
	} catch {
		return null;
	}
}

/**
 * Prüft Cloudflare Access JWT oder lokalen ADMIN_DEV_TOKEN (Bearer).
 * Access-Header: Cf-Access-Jwt-Assertion (Browser nach Login / Service Token am Edge).
 */
export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
	const { CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD, ADMIN_DEV_TOKEN } =
		getAuthEnv();

	const accessJwt = request.headers.get('Cf-Access-Jwt-Assertion');
	if (accessJwt && CF_ACCESS_TEAM_DOMAIN && CF_ACCESS_AUD) {
		const verified = await verifyAccessJwt(
			accessJwt,
			CF_ACCESS_TEAM_DOMAIN,
			CF_ACCESS_AUD,
		);
		if (verified) {
			return { ok: true, via: 'access', email: verified.email };
		}
		return { ok: false, status: 401, message: 'Access-Token ungültig' };
	}

	const bearer = bearerToken(request);
	const cookie = cookieToken(request);
	if (
		ADMIN_DEV_TOKEN &&
		((bearer && bearer === ADMIN_DEV_TOKEN) ||
			(cookie && cookie === ADMIN_DEV_TOKEN))
	) {
		return { ok: true, via: 'dev' };
	}

	if (!CF_ACCESS_TEAM_DOMAIN || !CF_ACCESS_AUD) {
		if (!ADMIN_DEV_TOKEN) {
			return {
				ok: false,
				status: 503,
				message:
					'Admin-Auth nicht konfiguriert (CF_ACCESS_* oder ADMIN_DEV_TOKEN)',
			};
		}
		return {
			ok: false,
			status: 401,
			message: 'Authorization: Bearer <ADMIN_DEV_TOKEN> erforderlich',
		};
	}

	return {
		ok: false,
		status: 401,
		message: 'Cloudflare Access Anmeldung erforderlich',
	};
}

export function unauthorizedResponse(result: Extract<AdminAuthResult, { ok: false }>) {
	return new Response(JSON.stringify({ error: result.message }), {
		status: result.status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
		},
	});
}
