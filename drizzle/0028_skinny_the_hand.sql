ALTER TABLE `organizations` ADD `street` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `zip` varchar(10);--> statement-breakpoint
ALTER TABLE `organizations` ADD `city` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `country` varchar(100) DEFAULT 'Deutschland';--> statement-breakpoint
ALTER TABLE `organizations` ADD `latitude` double;--> statement-breakpoint
ALTER TABLE `organizations` ADD `longitude` double;