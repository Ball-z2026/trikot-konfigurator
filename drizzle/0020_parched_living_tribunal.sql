ALTER TABLE `saved_designs` ADD `thumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `saved_designs` ADD `isOrgTemplate` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `saved_designs` ADD `orgId` int;--> statement-breakpoint
ALTER TABLE `saved_designs` ADD `category` enum('heimtrikot','auswaertstrikot','training','sonstiges') DEFAULT 'sonstiges';