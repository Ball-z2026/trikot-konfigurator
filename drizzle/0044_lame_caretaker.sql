CREATE TABLE `design_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text NOT NULL,
	`storageKey` text,
	`positionsConfig` json,
	`orgId` int NOT NULL,
	`departmentId` int,
	`teamId` int,
	`sport` enum('fussball','handball','volleyball','basketball'),
	`category` enum('Trikot','Bekleidung') DEFAULT 'Trikot',
	`visibility` enum('private','team','department','org') NOT NULL DEFAULT 'team',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `design_templates_id` PRIMARY KEY(`id`)
);
