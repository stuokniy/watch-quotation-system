CREATE TABLE `blacklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(50) NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blacklist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`uploadDate` timestamp NOT NULL DEFAULT (now()),
	`totalMessages` int DEFAULT 0,
	`parsedQuotations` int DEFAULT 0,
	CONSTRAINT `chatFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chatFileId` int NOT NULL,
	`watchModel` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'HKD',
	`warrantyDate` varchar(50),
	`sellerPhone` varchar(50) NOT NULL,
	`sellerName` varchar(100),
	`quoteDate` timestamp NOT NULL,
	`messageText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `blacklist` (`userId`);--> statement-breakpoint
CREATE INDEX `phoneNumber_idx` ON `blacklist` (`phoneNumber`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `chatFiles` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `quotations` (`userId`);--> statement-breakpoint
CREATE INDEX `watchModel_idx` ON `quotations` (`watchModel`);--> statement-breakpoint
CREATE INDEX `sellerPhone_idx` ON `quotations` (`sellerPhone`);--> statement-breakpoint
CREATE INDEX `quoteDate_idx` ON `quotations` (`quoteDate`);