ALTER TABLE `product_parts` ADD `seamPositions` json;--> statement-breakpoint
ALTER TABLE `product_parts` ADD `realWidthCm` float;--> statement-breakpoint
ALTER TABLE `product_parts` ADD `realHeightCm` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `minWidthCm` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `maxWidthCm` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `minHeightCm` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `maxHeightCm` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `maxAreaCm2` float;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `required` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `product_zones` ADD `allowedFonts` json;