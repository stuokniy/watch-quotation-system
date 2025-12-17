CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`groupId` varchar(255) NOT NULL,
	`groupName` varchar(255) NOT NULL,
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`lastSyncTime` timestamp,
	`messageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `groups_groupId_unique` UNIQUE(`groupId`)
);
--> statement-breakpoint
CREATE TABLE `syncStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`groupId` varchar(255) NOT NULL,
	`status` enum('running','paused','error') NOT NULL DEFAULT 'running',
	`lastMessage` timestamp,
	`errorMessage` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `syncStatus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `groups` (`userId`);--> statement-breakpoint
CREATE INDEX `groupId_idx` ON `groups` (`groupId`);--> statement-breakpoint
CREATE INDEX `userId_groupId_idx` ON `syncStatus` (`userId`,`groupId`);