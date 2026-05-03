ALTER TABLE `organizations` ADD `primaryColor` varchar(7);--> statement-breakpoint
ALTER TABLE `organizations` ADD `secondaryColor` varchar(7);--> statement-breakpoint
ALTER TABLE `organizations` ADD `jerseyName` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `onboardingComplete` boolean DEFAULT false NOT NULL;