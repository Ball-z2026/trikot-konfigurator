CREATE TABLE `product_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`side` enum('front','back') NOT NULL DEFAULT 'front',
	`type` enum('image','text','both') NOT NULL DEFAULT 'image',
	`posX` float NOT NULL DEFAULT 10,
	`posY` float NOT NULL DEFAULT 10,
	`width` float NOT NULL DEFAULT 20,
	`height` float NOT NULL DEFAULT 15,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`frontImageUrl` text,
	`backImageUrl` text,
	`published` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
