CREATE TABLE `template_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`approverType` enum('department_lead','owner','sponsor') NOT NULL,
	`approverUserId` int,
	`sponsorId` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comment` text,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `template_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_poll_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pollId` int NOT NULL,
	`templateId` int NOT NULL,
	`label` varchar(255),
	CONSTRAINT `template_poll_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_poll_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pollId` int NOT NULL,
	`optionId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `template_poll_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_polls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`teamId` int NOT NULL,
	`orgId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_polls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `design_templates` ADD `approvalStatus` enum('draft','pending','approved','rejected') DEFAULT 'draft' NOT NULL;