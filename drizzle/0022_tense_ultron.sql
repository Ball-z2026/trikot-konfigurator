CREATE TABLE `mockup_gallery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`productId` int NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`side` enum('front','back') NOT NULL DEFAULT 'front',
	`title` varchar(255),
	`shareToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mockup_gallery_id` PRIMARY KEY(`id`)
);
