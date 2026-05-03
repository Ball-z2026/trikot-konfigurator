ALTER TABLE `sponsor_templates` ADD `sponsoringAmount` int;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `sponsoringCurrency` varchar(3) DEFAULT 'EUR';--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `contractStart` timestamp;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `contractEnd` timestamp;