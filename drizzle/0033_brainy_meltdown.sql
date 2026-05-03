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
