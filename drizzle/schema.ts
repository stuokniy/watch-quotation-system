import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Chat files uploaded by users
 */
export const chatFiles = mysqlTable("chatFiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  uploadDate: timestamp("uploadDate").defaultNow().notNull(),
  totalMessages: int("totalMessages").default(0),
  parsedQuotations: int("parsedQuotations").default(0),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type ChatFile = typeof chatFiles.$inferSelect;
export type InsertChatFile = typeof chatFiles.$inferInsert;

/**
 * Watch quotations extracted from WhatsApp chats
 */
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chatFileId: int("chatFileId").notNull(),
  watchModel: varchar("watchModel", { length: 255 }).notNull(),
  price: int("price").notNull(), // Store as cents/smallest unit to avoid decimal issues
  currency: varchar("currency", { length: 10 }).default("HKD").notNull(),
  warrantyDate: varchar("warrantyDate", { length: 50 }), // Store as string for flexibility
  sellerPhone: varchar("sellerPhone", { length: 50 }).notNull(),
  sellerName: varchar("sellerName", { length: 100 }),
  quoteDate: timestamp("quoteDate").notNull(),
  messageText: text("messageText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  watchModelIdx: index("watchModel_idx").on(table.watchModel),
  sellerPhoneIdx: index("sellerPhone_idx").on(table.sellerPhone),
  quoteDateIdx: index("quoteDate_idx").on(table.quoteDate),
}));

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

/**
 * Blacklisted phone numbers
 */
export const blacklist = mysqlTable("blacklist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  phoneNumberIdx: index("phoneNumber_idx").on(table.phoneNumber),
}));

export type Blacklist = typeof blacklist.$inferSelect;
export type InsertBlacklist = typeof blacklist.$inferInsert;

/**
 * WhatsApp groups being monitored
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  groupId: varchar("groupId", { length: 255 }).notNull().unique(),
  groupName: varchar("groupName", { length: 255 }).notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  lastSyncTime: timestamp("lastSyncTime"),
  messageCount: int("messageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  groupIdIdx: index("groupId_idx").on(table.groupId),
}));

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * Sync status for each group
 */
export const syncStatus = mysqlTable("syncStatus", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  groupId: varchar("groupId", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["running", "paused", "error"]).default("running").notNull(),
  lastMessage: timestamp("lastMessage"),
  errorMessage: text("errorMessage"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdGroupIdIdx: index("userId_groupId_idx").on(table.userId, table.groupId),
}));

export type SyncStatus = typeof syncStatus.$inferSelect;
export type InsertSyncStatus = typeof syncStatus.$inferInsert;
