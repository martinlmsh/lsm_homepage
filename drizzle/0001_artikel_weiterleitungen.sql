CREATE TABLE `artikel_weiterleitungen` (
	`alter_slug` text PRIMARY KEY NOT NULL,
	`artikel_id` text NOT NULL,
	`erstellt_am` text NOT NULL,
	FOREIGN KEY (`artikel_id`) REFERENCES `artikel`(`id`) ON UPDATE no action ON DELETE cascade
);
