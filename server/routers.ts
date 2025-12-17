import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addToBlacklist,
  createChatFile,
  createQuotations,
  getBlacklist,
  getChatFilesByUserId,
  removeFromBlacklist,
  searchQuotations,
  updateChatFileStats,
} from "./db";
import { storagePut } from "./storage";
import { parseWhatsAppChatFile } from "./whatsappParser";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chatFiles: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getChatFilesByUserId(ctx.user.id);
    }),

    upload: protectedProcedure
      .input(
        z.object({
          filename: z.string(),
          content: z.string(), // Base64 encoded file content
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;

        // Decode base64 content
        const buffer = Buffer.from(input.content, 'base64');
        const chatText = buffer.toString('utf-8');

        // Parse WhatsApp chat
        const { messages, quotations } = parseWhatsAppChatFile(chatText);

        // Upload file to S3
        const randomSuffix = Math.random().toString(36).substring(2, 15);
        const fileKey = `user-${userId}/chats/${input.filename}-${randomSuffix}.txt`;
        const { url: fileUrl } = await storagePut(fileKey, buffer, 'text/plain');

        // Save chat file record
        const chatFileId = await createChatFile({
          userId,
          filename: input.filename,
          fileKey,
          fileUrl,
          totalMessages: messages.length,
          parsedQuotations: quotations.length,
        });

        // Save quotations
        if (quotations.length > 0) {
          const quotationRecords = quotations.map(q => ({
            userId,
            chatFileId: Number(chatFileId),
            watchModel: q.watchModel,
            price: q.price,
            currency: q.currency,
            warrantyDate: q.warrantyDate || null,
            sellerPhone: q.sellerPhone,
            sellerName: q.sellerName || null,
            quoteDate: q.quoteDate,
            messageText: q.messageText,
          }));

          await createQuotations(quotationRecords);
        }

        return {
          success: true,
          chatFileId: Number(chatFileId),
          totalMessages: messages.length,
          parsedQuotations: quotations.length,
        };
      }),
  }),

  quotations: router({
    search: protectedProcedure
      .input(
        z.object({
          searchTerm: z.string().optional(),
          sortBy: z.enum(['price_asc', 'price_desc', 'date_desc']).default('date_desc'),
        })
      )
      .query(async ({ ctx, input }) => {
        return searchQuotations(ctx.user.id, input.searchTerm, input.sortBy);
      }),
  }),

  blacklist: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getBlacklist(ctx.user.id);
    }),

    add: protectedProcedure
      .input(
        z.object({
          phoneNumber: z.string(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await addToBlacklist(ctx.user.id, input.phoneNumber, input.reason);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(
        z.object({
          phoneNumber: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await removeFromBlacklist(ctx.user.id, input.phoneNumber);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
