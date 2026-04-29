CREATE TABLE `player_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`teamId` int NOT NULL,
	`paid` boolean NOT NULL DEFAULT false,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`street` varchar(255),
	`zip` varchar(10),
	`city` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sponsors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`paymentType` enum('club','sponsor','self') NOT NULL,
	`status` enum('pending','confirmed') NOT NULL DEFAULT 'pending',
	`confirmationToken` varchar(64),
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_payments_id` PRIMARY KEY(`id`)
);
