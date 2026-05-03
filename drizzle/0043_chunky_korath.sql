CREATE TABLE `department_suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departmentId` int NOT NULL,
	`orgId` int NOT NULL,
	`brand` varchar(100) NOT NULL,
	`scope` enum('alle_artikel','nur_trikots') NOT NULL DEFAULT 'alle_artikel',
	`contractStart` timestamp,
	`contractEnd` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `department_suppliers_id` PRIMARY KEY(`id`)
);
