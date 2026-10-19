type CloudflareEnv = {
	DB: D1Database;
	BILDER: R2Bucket;
	ASSETS: Fetcher;
	CF_ACCESS_TEAM_DOMAIN?: string;
	CF_ACCESS_AUD?: string;
	ADMIN_DEV_TOKEN?: string;
};

declare namespace Cloudflare {
	interface Env extends CloudflareEnv {}
}

declare module 'cloudflare:workers' {
	export const env: CloudflareEnv;
}
