CREATE TABLE `collection_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`departmentId` int NOT NULL,
	`assignedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`savedDesignId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`orgId` int NOT NULL,
	`departmentId` int,
	`createdByUserId` int NOT NULL,
	`scope` enum('team','department','org') NOT NULL DEFAULT 'team',
	`enforcement` enum('optional','mandatory') NOT NULL DEFAULT 'optional',
	`thumbnailUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`)
);
