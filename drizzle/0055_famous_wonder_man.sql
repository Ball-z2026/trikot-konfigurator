CREATE TABLE `section_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` varchar(100) NOT NULL,
	`rating` enum('bad','good','excellent') NOT NULL,
	`ratedBy` int,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `section_ratings_id` PRIMARY KEY(`id`),
	CONSTRAINT `section_ratings_sectionId_unique` UNIQUE(`sectionId`)
);
--> statement-breakpoint
ALTER TABLE `section_ratings` ADD CONSTRAINT `section_ratings_ratedBy_users_id_fk` FOREIGN KEY (`ratedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;