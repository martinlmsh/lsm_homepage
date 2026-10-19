INSERT OR REPLACE INTO bilder (id, r2_key, alt, breite, hoehe, bytes, erstellt_am)
VALUES (
  'bild-beispiel-01',
  'beispiel/titelbild.png',
  'Beispielbild für einen Artikel über Wärmepumpen in der Region',
  64,
  40,
  0,
  '2026-10-01T10:00:00.000Z'
);

INSERT OR REPLACE INTO artikel (
  id, slug, titel, typ, teaser, inhalt_md, titelbild_id, leistung, ort,
  meta_title, meta_description, status, quelle, veroeffentlicht_am, aktualisiert_am
) VALUES (
  'artikel-blog-01',
  'waermepumpe-vor-ort-termin',
  'Was Sie beim Vor-Ort-Termin zur Wärmepumpe erwartet',
  'blogartikel',
  'Ein strukturierter Ablauf vom Aufmaß bis zur ersten Einschätzung – ohne Technik-Jargon.',
  '## Der erste Termin zählt

Beim Vor-Ort-Termin nehmen wir Gebäude, bestehende Heizung und Ihre Ziele auf. Daraus entsteht ein Aufmaß und eine erste Einschätzung, ob eine Wärmepumpe sinnvoll erscheint.

:::info
Die Umsetzung übernehmen Partnerbetriebe. Lemisch Sanierung & Modernisierung begleitet und koordiniert – Sie behalten eine klare Ansprechperson.
:::

## Feinplanung und Förderantrag

Passt der Weg, folgt die Feinplanung mit Heizlast nach DIN. Gemeinsam bereiten wir den Förderantrag vor und stimmen Termine mit dem ausführenden Betrieb ab.

<script>alert("sollte nicht erscheinen")</script>

So behalten Sie den Überblick von der ersten Einschätzung bis zur Umsetzung in Tuttlingen und Umgebung.
',
  'bild-beispiel-01',
  'waermepumpe',
  'Tuttlingen',
  'Vor-Ort-Termin Wärmepumpe | Lemisch',
  'Ablauf des Vor-Ort-Termins zur Wärmepumpe: Aufmaß, erste Einschätzung und nächste Schritte in der Region.',
  'veroeffentlicht',
  'editor',
  '2026-10-10T09:00:00.000Z',
  '2026-10-12T14:00:00.000Z'
);

INSERT OR REPLACE INTO artikel (
  id, slug, titel, typ, teaser, inhalt_md, titelbild_id, leistung, ort,
  meta_title, meta_description, status, quelle, veroeffentlicht_am, aktualisiert_am
) VALUES (
  'artikel-projekt-01',
  'projekt-entwurf-beispiel',
  'Projektbericht Entwurf (nicht öffentlich)',
  'projektbericht',
  'Dieser Entwurf dient nur der lokalen Entwicklung und darf nicht öffentlich erscheinen.',
  '## Entwurf

Dieser Projektbericht ist als Entwurf gespeichert und darf in der öffentlichen Übersicht nicht erscheinen.
',
  NULL,
  NULL,
  'Rottweil',
  'Projektbericht Entwurf | Lemisch',
  'Entwurf eines Projektberichts – nur für lokale Tests, nicht veröffentlicht.',
  'entwurf',
  'editor',
  NULL,
  '2026-10-08T11:00:00.000Z'
);
