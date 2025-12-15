import { and, desc, eq, like, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { blacklist, chatFiles, InsertBlacklist, InsertChatFile, InsertQuotation, InsertUser, quotations, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Chat Files
export async function createChatFile(file: InsertChatFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatFiles).values(file);
  return result[0].insertId;
}

export async function getChatFilesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(chatFiles).where(eq(chatFiles.userId, userId)).orderBy(desc(chatFiles.uploadDate));
}

export async function updateChatFileStats(fileId: number, totalMessages: number, parsedQuotations: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(chatFiles)
    .set({ totalMessages, parsedQuotations })
    .where(eq(chatFiles.id, fileId));
}

// Quotations
export async function createQuotation(quotation: InsertQuotation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(quotations).values(quotation);
}

export async function createQuotations(quotationList: InsertQuotation[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (quotationList.length === 0) return;

  await db.insert(quotations).values(quotationList);
}

export async function searchQuotations(
  userId: number,
  searchTerm?: string,
  sortBy: 'price_asc' | 'price_desc' | 'date_desc' = 'date_desc'
) {
  const db = await getDb();
  if (!db) return [];

  // Get blacklisted phone numbers
  const blacklistedNumbers = await getBlacklistedPhones(userId);

  const conditions = [eq(quotations.userId, userId)];

  // Filter out blacklisted sellers
  if (blacklistedNumbers.length > 0) {
    conditions.push(notInArray(quotations.sellerPhone, blacklistedNumbers));
  }

  // Search by watch model
  if (searchTerm) {
    conditions.push(like(quotations.watchModel, `%${searchTerm}%`));
  }

  let query = db.select().from(quotations).where(and(...conditions));

  // Sort
  if (sortBy === 'price_asc') {
    return query.orderBy(quotations.price);
  } else if (sortBy === 'price_desc') {
    return query.orderBy(desc(quotations.price));
  } else {
    return query.orderBy(desc(quotations.quoteDate));
  }
}

export async function getQuotationsByModel(userId: number, watchModel: string) {
  const db = await getDb();
  if (!db) return [];

  // Get blacklisted phone numbers
  const blacklistedNumbers = await getBlacklistedPhones(userId);

  let conditions = [eq(quotations.userId, userId), eq(quotations.watchModel, watchModel)];

  if (blacklistedNumbers.length > 0) {
    return db.select()
      .from(quotations)
      .where(and(...conditions, notInArray(quotations.sellerPhone, blacklistedNumbers)))
      .orderBy(quotations.price);
  }

  return db.select()
    .from(quotations)
    .where(and(...conditions))
    .orderBy(quotations.price);
}

// Blacklist
export async function addToBlacklist(userId: number, phoneNumber: string, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(blacklist).values({
    userId,
    phoneNumber,
    reason: reason || null,
  });
}

export async function removeFromBlacklist(userId: number, phoneNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(blacklist)
    .where(and(eq(blacklist.userId, userId), eq(blacklist.phoneNumber, phoneNumber)));
}

export async function getBlacklist(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(blacklist).where(eq(blacklist.userId, userId)).orderBy(desc(blacklist.createdAt));
}

export async function getBlacklistedPhones(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ phoneNumber: blacklist.phoneNumber })
    .from(blacklist)
    .where(eq(blacklist.userId, userId));

  return result.map(r => r.phoneNumber);
}

export async function isBlacklisted(userId: number, phoneNumber: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select()
    .from(blacklist)
    .where(and(eq(blacklist.userId, userId), eq(blacklist.phoneNumber, phoneNumber)))
    .limit(1);

  return result.length > 0;
}
