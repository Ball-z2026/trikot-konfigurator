ALTER TABLE `product_zones` ADD `textStyle` enum('arc','straight') DEFAULT 'straight';--> statement-breakpoint
ALTER TABLE `product_zones` ADD `arcDegree` float DEFAULT 0;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `outlineColor` varchar(20);--> statement-breakpoint
ALTER TABLE `product_zones` ADD `outlineWidth` float DEFAULT 0;