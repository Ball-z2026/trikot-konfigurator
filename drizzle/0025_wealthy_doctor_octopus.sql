ALTER TABLE `sponsor_templates` ADD `sponsorType` enum('hauptsponsor','spartensponsor','mannschaftssponsor') DEFAULT 'hauptsponsor' NOT NULL;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `obligation` enum('alle_produkte','nur_trikot','nicht_verpflichtend') DEFAULT 'nicht_verpflichtend' NOT NULL;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `departmentId` int;--> statement-breakpoint
ALTER TABLE `sponsor_templates` ADD `teamId` int;