import { Message } from 'whatsapp-web.js';
import { whatsappService } from './whatsappService';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { groups, syncStatus } from '../drizzle/schema';
import { parseWhatsAppChat } from './whatsappParser';
import { createQuotations } from './db';

/**
 * WhatsApp 同步服務
 * 管理群組同步、消息處理和報價提取
 */
export class WhatsAppSyncService {
  private userId: number;
  private isRunning = false;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * 初始化同步服務
   */
  async initialize(): Promise<void> {
    try {
      // 初始化 WhatsApp 客戶端
      await whatsappService.initialize();

      // 設置消息隊列處理
      whatsappService.startQueueProcessing(
        (messages) => this.processBatch(messages),
        100 // 每批 100 條消息
      );

      // 恢復已保存的群組監聽
      await this.restoreGroupMonitoring();

      this.isRunning = true;
      console.log(`[Sync] Service initialized for user ${this.userId}`);
    } catch (error) {
      console.error('[Sync] Failed to initialize service:', error);
      throw error;
    }
  }

  /**
   * 恢復已保存的群組監聽
   */
  private async restoreGroupMonitoring(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      // 獲取用戶的所有活躍群組
      const userGroups = await db
        .select()
        .from(groups)
        .where(eq(groups.userId, this.userId));

      console.log(`[Sync] Restoring ${userGroups.length} groups for user ${this.userId}`);

      for (const group of userGroups) {
        try {
          await whatsappService.watchGroup(group.groupId);
          console.log(`[Sync] Restored group: ${group.groupName}`);
        } catch (error) {
          console.error(`[Sync] Failed to restore group ${group.groupId}:`, error);
        }
      }
    } catch (error) {
      console.error('[Sync] Failed to restore group monitoring:', error);
    }
  }

  /**
   * 添加群組到監聽列表
   */
  async addGroup(groupId: string, groupName: string): Promise<void> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // 保存群組配置
      await db.insert(groups).values({
        userId: this.userId,
        groupId,
        groupName,
        isActive: "true",
      });

      // 開始監聽群組
      await whatsappService.watchGroup(groupId);

      // 創建同步狀態記錄
      await db.insert(syncStatus).values({
        userId: this.userId,
        groupId,
        status: "running",
      });

      console.log(`[Sync] Added group ${groupName} (${groupId})`);
    } catch (error) {
      console.error('[Sync] Failed to add group:', error);
      throw error;
    }
  }

  /**
   * 移除群組監聽
   */
  async removeGroup(groupId: string): Promise<void> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // 更新群組狀態
      await db
        .update(groups)
        .set({ isActive: "false" })
        .where(eq(groups.groupId, groupId));

      // 停止監聽
      await whatsappService.unwatchGroup(groupId);

      console.log(`[Sync] Removed group ${groupId}`);
    } catch (error) {
      console.error('[Sync] Failed to remove group:', error);
      throw error;
    }
  }

  /**
   * 處理一批消息
   */
  private async processBatch(messages: Message[]): Promise<void> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const quotations: any[] = [];

      for (const msg of messages) {
        try {
          const groupId = (msg as any).from;
          const senderName = (msg as any).author || 'Unknown';
          const senderPhone = this.extractPhoneFromMessage(msg);
          const messageText = msg.body;
          const timestamp = new Date(msg.timestamp * 1000);

          // 解析報價
          const { extractPrice, extractWatchModel, extractWarrantyDate } = await import('./whatsappParser');
          const priceMatch = extractPrice(messageText);
          const modelMatch = extractWatchModel(messageText);

          if (modelMatch && priceMatch) {
            // 找到報價信息
            quotations.push({
              userId: this.userId,
              groupId,
              watchModel: modelMatch[0],
              price: priceMatch.amount,
              currency: priceMatch.currency,
              warrantyDate: extractWarrantyDate(messageText) || null,
              sellerPhone: senderPhone,
              sellerName: senderName,
              quoteDate: timestamp,
              messageText,
            });
          }
        } catch (error) {
          console.error('[Sync] Error processing message:', error);
          continue;
        }
      }

      // 批量保存報價
      if (quotations.length > 0) {
        await createQuotations(quotations);
        console.log(`[Sync] Saved ${quotations.length} quotations`);

        // 發出事件通知前端
        whatsappService.emit('quotations_added', {
          userId: this.userId,
          count: quotations.length,
        });
      }
    } catch (error) {
      console.error('[Sync] Error processing batch:', error);
      throw error;
    }
  }

  /**
   * 從消息中提取電話號碼
   */
  private extractPhoneFromMessage(msg: Message): string {
    // WhatsApp 消息的 from 字段包含電話號碼
    const from = (msg as any).from || '';
    // 格式通常是 "85212345678@c.us"
    const match = from.match(/^(\d+)@/);
    if (match) {
      const phone = match[1];
      // 轉換為國際格式
      if (!phone.startsWith('+')) {
        return '+' + phone;
      }
      return '+' + phone;
    }
    return from;
  }

  /**
   * 獲取同步狀態
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    whatsappStatus: any;
    groupStats: any;
  }> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const userGroups = await db
        .select()
        .from(groups)
        .where(eq(groups.userId, this.userId));

      const whatsappStatus = whatsappService.getMonitoringStatus();

      return {
        isRunning: this.isRunning,
        whatsappStatus,
        groupStats: {
          totalGroups: userGroups.length,
          activeGroups: userGroups.filter((g) => g.isActive).length,
          groups: userGroups.map((g) => ({
            id: g.groupId,
            name: g.groupName,
            isActive: g.isActive,
            lastSync: g.lastSyncTime,
            messageCount: g.messageCount,
          })),
        },
      };
    } catch (error) {
      console.error('[Sync] Error getting status:', error);
      throw error;
    }
  }

  /**
   * 停止同步服務
   */
  async stop(): Promise<void> {
    try {
      whatsappService.stopQueueProcessing();
      this.isRunning = false;
      console.log('[Sync] Service stopped');
    } catch (error) {
      console.error('[Sync] Error stopping service:', error);
      throw error;
    }
  }

  /**
   * 銷毀服務
   */
  async destroy(): Promise<void> {
    try {
      await this.stop();
      await whatsappService.destroy();
      console.log('[Sync] Service destroyed');
    } catch (error) {
      console.error('[Sync] Error destroying service:', error);
      throw error;
    }
  }
}

// 全局同步服務實例管理
const syncServices = new Map<number, WhatsAppSyncService>();

export function getSyncService(userId: number): WhatsAppSyncService {
  if (!syncServices.has(userId)) {
    syncServices.set(userId, new WhatsAppSyncService(userId));
  }
  return syncServices.get(userId)!;
}

export function removeSyncService(userId: number): void {
  syncServices.delete(userId);
}
