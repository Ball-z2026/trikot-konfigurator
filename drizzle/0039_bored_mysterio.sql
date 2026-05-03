DROP TABLE `sponsor_invitations`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `primaryColor`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `secondaryColor`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `primaryColorCmyk`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `secondaryColorCmyk`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `jerseyName`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `onboardingComplete`;--> statement-breakpoint
ALTER TABLE `sponsor_templates` DROP COLUMN `logoMimeType`;--> statement-breakpoint
ALTER TABLE `sponsor_templates` DROP COLUMN `logoThumbnailUrl`;--> statement-breakpoint
ALTER TABLE `sponsor_templates` DROP COLUMN `sponsoringAmount`;--> statement-breakpoint
ALTER TABLE `sponsor_templates` DROP COLUMN `sponsoringCurrency`;--> statement-breakpoint
ALTER TABLE `sponsor_templates` DROP COLUMN `contractStart`;--> statement-breakpoint
ALTER TABLE `sponsor_templates` DROP COLUMN `contractEnd`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `totpSecret`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `totpEnabled`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `backupCodes`;