ALTER TABLE `organizations` ADD `supplierBrand` varchar(100);--> statement-breakpoint
ALTER TABLE `organizations` ADD `supplierScope` enum('ganzer_verein','nur_sparten','nur_trikots','alle_artikel');--> statement-breakpoint
ALTER TABLE `organizations` ADD `supplierContractStart` timestamp;--> statement-breakpoint
ALTER TABLE `organizations` ADD `supplierContractEnd` timestamp;