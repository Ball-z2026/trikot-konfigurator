CREATE TABLE `beta_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`page` varchar(100) NOT NULL,
	`area` varchar(255),
	`message` text NOT NULL,
	`status` enum('open','resolved','still_present') NOT NULL DEFAULT 'open',
	`adminNote` text,
	`userAgent` text,
	`currentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `beta_feedback_id` PRIMARY KEY(`id`)
);
