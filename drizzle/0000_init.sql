CREATE TABLE `artikel` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`titel` text NOT NULL,
	`typ` text NOT NULL,
	`teaser` text NOT NULL,
	`inhalt_md` text NOT NULL,
	`titelbild_id` text,
	`leistung` text,
	`ort` text,
	`meta_title` text NOT NULL,
	`meta_description` text NOT NULL,
	`status` text NOT NULL,
	`quelle` text NOT NULL,
	`veroeffentlicht_am` text,
	`aktualisiert_am` text NOT NULL,
	FOREIGN KEY (`titelbild_id`) REFERENCES `bilder`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artikel_slug_unique` ON `artikel` (`slug`);--> statement-breakpoint
CREATE TABLE `bilder` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`alt` text NOT NULL,
	`breite` integer,
	`hoehe` integer,
	`bytes` integer,
	`erstellt_am` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bilder_r2_key_unique` ON `bilder` (`r2_key`);