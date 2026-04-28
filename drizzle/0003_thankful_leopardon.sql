CREATE TABLE `product_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`key` varchar(100) NOT NULL,
	`label` varchar(255) NOT NULL,
	`imageUrl` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_zones` ADD `partId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `templateId` varchar(100);