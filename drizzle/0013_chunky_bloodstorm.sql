CREATE TABLE `saved_designs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`teamId` int NOT NULL,
	`productId` int NOT NULL,
	`userId` int NOT NULL,
	`zonesConfig` json NOT NULL,
	`colorsConfig` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_designs_id` PRIMARY KEY(`id`)
);
