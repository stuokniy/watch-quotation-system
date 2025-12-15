import { Client, LocalAuth, Events, GroupChat, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { EventEmitter } from 'events';
import path from 'path';

/**
 * WhatsApp Web 客戶端包裝器
 * 管理連接、群組監聽和消息處理
 */
export class WhatsAppService extends EventEmitter {
  private client: Client | null = null;
  private isInitialized = false;
  private monitoredGroups = new Map<string, GroupChat>();
  private messageQueue: Message[] = [];
  private queueProcessingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * 初始化 WhatsApp Web 客戶端
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[WhatsApp] Client already initialized');
      return;
    }

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'watch-quotation-bot',
          dataPath: path.join(process.cwd(), '.wwebjs_auth'),
        }),
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true,
        },
      });

      // 設置事件監聽
      this.setupEventListeners();

      // 初始化客戶端
      await this.client.initialize();
      this.isInitialized = true;

      console.log('[WhatsApp] Client initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('[WhatsApp] Failed to initialize client:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 設置事件監聽
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // QR 碼掃描
    this.client.on(Events.QR_RECEIVED, (qr) => {
      console.log('[WhatsApp] QR Code received. Scan with WhatsApp:');
      qrcode.generate(qr, { small: true });
      this.emit('qr_received', qr);
    });

    // 客戶端就緒
    this.client.on('ready' as any, () => {
      console.log('[WhatsApp] Client is ready!');
      this.emit('ready');
    });

    // 消息接收
    this.client.on(Events.MESSAGE_RECEIVED, (msg) => {
      this.handleMessageReceived(msg);
    });

    // 認證失敗
    this.client.on(Events.AUTHENTICATION_FAILURE, () => {
      console.error('[WhatsApp] Authentication failed');
      this.emit('auth_failed');
    });

    // 斷開連接
    this.client.on(Events.DISCONNECTED, () => {
      console.log('[WhatsApp] Client disconnected');
      this.isInitialized = false;
      this.emit('disconnected');
    });
  }

  /**
   * 處理接收到的消息
   */
  private handleMessageReceived(msg: Message): void {
    // 只處理群組消息
    if (!(msg as any).isGroupMsg) return;

    // 跳過系統消息
    if ((msg as any).type === 'notification') return;

    // 添加到隊列
    this.messageQueue.push(msg);

    console.log(`[WhatsApp] Message received from ${msg.from}: ${msg.body.substring(0, 50)}`);
    this.emit('message_received', msg);
  }

  /**
   * 獲取所有群組
   */
  async getGroups(): Promise<Array<{ id: string; name: string }>> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const chats = await this.client.getChats();
      const groups = chats
        .filter((chat) => chat.isGroup)
        .map((chat) => ({
          id: chat.id._serialized,
          name: chat.name,
        }));

      console.log(`[WhatsApp] Found ${groups.length} groups`);
      return groups;
    } catch (error) {
      console.error('[WhatsApp] Failed to get groups:', error);
      throw error;
    }
  }

  /**
   * 開始監聽特定群組
   */
  async watchGroup(groupId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const chat = await this.client.getChatById(groupId);

      if (!chat.isGroup) {
        throw new Error(`${groupId} is not a group`);
      }

      this.monitoredGroups.set(groupId, chat as GroupChat);
      console.log(`[WhatsApp] Now watching group: ${chat.name}`);
      this.emit('group_watched', { groupId, groupName: chat.name });
    } catch (error) {
      console.error(`[WhatsApp] Failed to watch group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * 停止監聽特定群組
   */
  async unwatchGroup(groupId: string): Promise<void> {
    this.monitoredGroups.delete(groupId);
    console.log(`[WhatsApp] Stopped watching group: ${groupId}`);
    this.emit('group_unwatched', { groupId });
  }

  /**
   * 獲取監聽狀態
   */
  getMonitoringStatus(): {
    isConnected: boolean;
    monitoredGroups: Array<{ id: string; name: string }>;
    queueSize: number;
  } {
    return {
      isConnected: this.isInitialized,
      monitoredGroups: Array.from(this.monitoredGroups.entries()).map(([id, chat]) => ({
        id,
        name: chat.name,
      })),
      queueSize: this.messageQueue.length,
    };
  }

  /**
   * 開始處理消息隊列
   */
  startQueueProcessing(callback: (messages: Message[]) => Promise<void>, batchSize = 100): void {
    if (this.queueProcessingInterval) {
      console.log('[WhatsApp] Queue processing already started');
      return;
    }

    console.log('[WhatsApp] Starting queue processing');

    this.queueProcessingInterval = setInterval(async () => {
      if (this.messageQueue.length === 0) return;

      // 取出一批消息
      const batch = this.messageQueue.splice(0, batchSize);

      try {
        await callback(batch);
        console.log(`[WhatsApp] Processed ${batch.length} messages`);
      } catch (error) {
        console.error('[WhatsApp] Error processing message batch:', error);
        // 將失敗的消息重新加入隊列
        this.messageQueue.unshift(...batch);
      }
    }, 5000); // 每 5 秒檢查一次隊列
  }

  /**
   * 停止處理消息隊列
   */
  stopQueueProcessing(): void {
    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
      this.queueProcessingInterval = null;
      console.log('[WhatsApp] Queue processing stopped');
    }
  }

  /**
   * 獲取群組消息歷史
   */
  async getGroupMessages(groupId: string, limit = 100): Promise<Message[]> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const chat = await this.client.getChatById(groupId);
      const messages = await chat.fetchMessages({ limit });
      console.log(`[WhatsApp] Fetched ${messages.length} messages from group ${groupId}`);
      return messages;
    } catch (error) {
      console.error(`[WhatsApp] Failed to fetch messages from group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * 優雅關閉
   */
  async destroy(): Promise<void> {
    this.stopQueueProcessing();

    if (this.client) {
      try {
        await this.client.destroy();
        console.log('[WhatsApp] Client destroyed');
      } catch (error) {
        console.error('[WhatsApp] Error destroying client:', error);
      }
    }

    this.isInitialized = false;
    this.monitoredGroups.clear();
    this.messageQueue = [];
  }
}

// 導出單例
export const whatsappService = new WhatsAppService();
