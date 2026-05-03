ALTER TABLE `sponsor_templates` ADD `contactFirstName` varchar(100);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `contactLastName` varchar(100);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `contactEmail` varchar(255);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `contactPhone` varchar(50);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `street` varchar(255);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `zip` varchar(10);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `country` varchar(100) DEFAULT 'Deutschland';--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `vatId` varchar(50);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `billingDifferent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `billingStreet` varchar(255);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `billingZip` varchar(10);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `billingCity` varchar(100);--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `billingCountry` varchar(100);