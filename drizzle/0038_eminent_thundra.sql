ALTER TABLE `users` ADD `totpSecret` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `totpEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `backupCodes` text;