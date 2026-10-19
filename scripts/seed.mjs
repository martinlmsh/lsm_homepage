#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = join(root, 'scripts/seed-assets/beispiel.png');
const sqlPath = join(root, 'scripts/seed.sql');
const dbName = 'lsm-db';
const r2Key = 'beispiel/titelbild.png';

function run(cmd, args) {
	console.log('>', cmd, args.join(' '));
	execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
}

const bytes = readFileSync(asset).byteLength;
let sql = readFileSync(sqlPath, 'utf8');
sql = sql.replace(
	/('beispiel\/titelbild\.png',\n  'Beispielbild[^']*',\n  64,\n  40,\n  )0,/,
	`$1${bytes},`,
);
const seededSql = join(root, 'scripts/.seed-generated.sql');
writeFileSync(seededSql, sql);

run('npx', [
	'wrangler',
	'r2',
	'object',
	'put',
	`lsm-bilder/${r2Key}`,
	`--file=${asset}`,
	'--content-type=image/png',
	'--local',
]);

run('npx', [
	'wrangler',
	'd1',
	'execute',
	dbName,
	'--local',
	`--file=${seededSql}`,
]);

console.log('Seed abgeschlossen: 1 Bild, 1 veröffentlichter Artikel, 1 Entwurf.');
