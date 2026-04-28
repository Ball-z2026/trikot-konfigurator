ALTER TABLE `product_zones` MODIFY COLUMN `purpose` enum('logo','playerName','playerNumber','clubName','custom') NOT NULL DEFAULT 'logo';--> statement-breakpoint
ALTER TABLE `product_zones` ADD `widthCm` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `heightCm` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `rotation` float DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `fontFamily` varchar(100);--> statement-breakpoint
ALTER TABLE `product_zones` ADD `fontSize` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `fontColor` varchar(20);--> statement-breakpoint
ALTER TABLE `product_zones` ADD `fontWeight` varchar(20);--> statement-breakpoint
ALTER TABLE `product_zones` ADD `textAlign` varchar(20);