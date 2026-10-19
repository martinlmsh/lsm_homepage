# Lemisch Sanierung & Modernisierung – Homepage

Astro-Website mit Content Collection für Leistungen, lokalem SEO, Lead-Formular und dem Bereich **Wissenswertes** (Cloudflare D1 + R2) inkl. Admin-API und Admin-UI.

## Voraussetzungen

- Node.js 22 oder neuer
- npm

## Befehle

```bash
npm install
npm run dev          # Astro Dev (Cloudflare workerd)
npm run build
npm run preview      # oder: npm run pages:dev
```

## Umgebungsvariablen

Kopieren Sie `.env.example` nach `.env` und für Wrangler `.dev.vars.example` nach `.dev.vars`:

| Variable | Beschreibung |
| --- | --- |
| `SITE_URL` | Öffentliche Domain (Canonicals, Sitemap, Schema). Fallback: `https://example.com` |
| `PUBLIC_LEAD_WEBHOOK_URL` | Webhook für Formular-POSTs. Ohne Wert: Hinweis „Formular noch nicht verbunden“ |
| `ADMIN_DEV_TOKEN` | Lokaler Admin-Bypass (Bearer oder Login-Cookie). Nur Entwicklung |
| `CF_ACCESS_TEAM_DOMAIN` | z. B. `ihr-team.cloudflareaccess.com` (Produktion) |
| `CF_ACCESS_AUD` | Application Audience Tag aus Cloudflare Access (Produktion) |

Produktion: Secrets per `wrangler secret put` bzw. Cloudflare Dashboard setzen.

## Cloudflare: D1, R2 und lokale Daten

Bindings stehen in `wrangler.toml` (`DB` = D1, `BILDER` = R2).

Lokale Datenbank und Seed (nach dem ersten Build bzw. vor `pages:dev`):

```bash
npm run db:migrate:local
npm run db:seed
npm run pages:dev
```

- Migrationen liegen in `drizzle/` und werden mit Wrangler angewendet.
- Der Seed legt 1 Beispielbild in R2 sowie 2 Artikel in D1 an (1 veröffentlicht mit `:::info`, 1 Entwurf).
- Schema-Änderungen: `npm run db:generate`, danach erneut `npm run db:migrate:local`.
- `pages:dev` nutzt `--persist-to .wrangler/state`, damit dieselbe lokale D1/R2-Datenbank wie Migration und Seed verwendet wird.

## Neue Leistung hinzufügen

1. Datei anlegen unter `src/content/leistungen/<slug>.md`
2. Slug: kleingeschrieben, Umlaute als `ae` / `oe` / `ue`, z. B. `photovoltaik.md` → `/photovoltaik/`
3. Frontmatter ausfüllen:

```yaml
---
title: Kurzname
metaTitle: … (max. 60 Zeichen)
metaDescription: … (max. 155 Zeichen)
h1: Seitenüberschrift
kurzbeschreibung: Text für Kacheln und Schema
reihenfolge: 2
---
```

4. Markdown-Inhalt ab `##` (H2) schreiben – die H1 kommt aus dem Frontmatter
5. `npm run build` ausführen

Navigation und Leistungsübersicht auf der Startseite werden aus der Collection erzeugt. Neue Einträge erscheinen automatisch.

**Reservierte Slugs:** `impressum`, `datenschutz`, `404`, `wissenswertes`, `bilder`, `admin`, `api` – nicht als Leistungs-Slug verwenden.

## Wissenswertes (öffentlich)

- Übersicht: `/wissenswertes/` (Filter `?typ=`, Paginierung `?seite=`)
- Artikel: `/wissenswertes/<slug>/` (nur `status = veroeffentlicht`)
- Bilder: `/bilder/<r2_key>` (ohne Trailing Slash)
- Dynamische Sitemap: `/sitemap-wissenswertes.xml`
- Lokaler Preview: `npm run pages:dev`

## Admin & API (Schreiben)

### UI

- Login: `/admin/login/` (lokal mit `ADMIN_DEV_TOKEN`)
- Dashboard: `/admin/`
- Artikel: `/admin/artikel/`, Neu `/admin/artikel/neu/`, Bearbeiten `/admin/artikel/<id>/`
- Bilder: `/admin/bilder/`

Seiten sind `noindex`; `robots.txt` enthält `Disallow: /admin` und `Disallow: /api/admin`.

### REST-API

Alle Routen erfordern Auth (Access-JWT oder lokal Bearer/`lsm_admin_token`-Cookie):

| Methode | Pfad | Zweck |
| --- | --- | --- |
| GET | `/api/admin/artikel` | Liste (`?status=`, `?typ=`, `?seite=`) |
| GET | `/api/admin/artikel/<id>` | Ein Artikel |
| POST | `/api/admin/artikel` | Anlegen |
| PUT | `/api/admin/artikel/<id>` | Aktualisieren |
| PATCH | `/api/admin/artikel/<id>/status` | `{ "status": "entwurf" \| "veroeffentlicht" }` |
| DELETE | `/api/admin/artikel/<id>` | Löschen |
| GET | `/api/admin/bilder` | Bilderliste |
| POST | `/api/admin/bilder` | Multipart: `file` + `alt` |
| POST | `/api/admin/login` | Lokal: `{ "token": "…" }` → Cookie |
| DELETE | `/api/admin/login` | Cookie löschen |

Beispiel lokal:

```bash
curl -s -H "Authorization: Bearer $ADMIN_DEV_TOKEN" \
  http://127.0.0.1:8787/api/admin/artikel
```

### Cloudflare Access (Produktion, Free-Plan)

Zero Trust Free: bis 50 Nutzer, Service Tokens inklusive – ausreichend für Solo + n8n.

1. Domain hinter Cloudflare, Site deployed
2. Zero Trust → Access → Application (Self-hosted) für Ihre Domain
3. Policy: Pfade `/admin*` und `/api/admin*` schützen
4. Allow: Ihre E-Mail (OTP / IdP)
5. Service Token anlegen für n8n
6. Secrets setzen: `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` (Audience Tag der Application)

**n8n-Headers** (zusätzlich zur API):

- `CF-Access-Client-Id`
- `CF-Access-Client-Secret`

Die App prüft das Access-JWT (`Cf-Access-Jwt-Assertion`) serverseitig nach.

Markdown im Feld `inhalt_md` / `inhaltMd`; Info-Kästen mit `:::info` … `:::`.

## Hosting

Cloudflare Pages/Workers (hybrid: bestehende Seiten prerendered, Wissenswertes/Bilder/Admin SSR). Domain und Lead-Webhook folgen später.
