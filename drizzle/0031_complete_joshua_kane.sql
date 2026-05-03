ALTER TABLE `organizations` ADD `officialName` varchar(500);--> statement-breakpoint
ALTER TABLE `organizations` ADD `contactFirstName` varchar(100);--> statement-breakpoint
ALTER TABLE `organizations` ADD `contactLastName` varchar(100);--> statement-breakpoint
ALTER TABLE `organizations` ADD `contactRole` varchar(100);--> statement-breakpoint
ALTER TABLE `organizations` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `organizations` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `website` varchar(500);--> statement-breakpoint
ALTER TABLE `organizations` ADD `fax` varchar(50);--> statement-breakpoint
ALTER TABLE `organizations` ADD `registerNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `organizations` ADD `taxId` varchar(50);--> statement-breakpoint
ALTER TABLE `organizations` ADD `foundedYear` int;