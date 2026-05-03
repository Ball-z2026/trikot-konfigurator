CREATE TABLE `sponsor_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`sponsorTemplateId` int,
	`token` varchar(64) NOT NULL,
	`sponsorEmail` varchar(255) NOT NULL,
	`sponsorName` varchar(255),
	`status` enum('pending','completed','expired') NOT NULL DEFAULT 'pending',
	`invitedBy` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sponsor_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `sponsor_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `organizations` ADD `primaryColor` varchar(7);--> statement-breakpoint
ALTER TABLE `organizations` ADD `secondaryColor` varchar(7);--> statement-breakpoint
ALTER TABLE `organizations` ADD `primaryColorCmyk` varchar(50);--> statement-breakpoint
ALTER TABLE `organizations` ADD `secondaryColorCmyk` varchar(50);--> statement-breakpoint
ALTER TABLE `organizations` ADD `jerseyName` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `onboardingComplete` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `logoMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `logoThumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `sponsoringAmount` int;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `sponsoringCurrency` varchar(3) DEFAULT 'EUR';--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `contractStart` timestamp;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `contractEnd` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `totpSecret` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `totpEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `backupCodes` text;