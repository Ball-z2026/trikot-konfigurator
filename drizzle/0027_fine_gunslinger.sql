CREATE TABLE `mockup_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mockupId` int NOT NULL,
	`sponsorId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewToken` varchar(128) NOT NULL,
	`reviewedBy` varchar(255),
	`reviewNote` text,
	`reviewedAt` timestamp,
	`revision` int NOT NULL DEFAULT 1,
	`submittedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mockup_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsor_product_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sponsorId` int NOT NULL,
	`productId` int NOT NULL,
	`assignedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sponsor_product_assignments_id` PRIMARY KEY(`id`)
);
