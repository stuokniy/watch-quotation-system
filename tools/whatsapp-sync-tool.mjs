#!/usr/bin/env node

/**
 * WhatsApp Chat Auto-Sync Tool
 * 
 * 每分鐘自動導出 WhatsApp 聊天記錄並上傳到系統
 * 
 * 使用方法：
 * 1. 配置 config.json
 * 2. node tools/whatsapp-sync-tool.mjs start
 * 3. 掃描二維碼登錄 WhatsApp Web
 * 4. 工具將每分鐘自動導出並上傳聊天記錄
 * 
 * 命令：
 * - start     : 啟動同步服務
 * - stop      : 停止同步服務
 * - status    : 查看同步狀態
 * - export    : 手動導出一次
 */

import { Client, LocalAuth, Events } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../config.whatsapp-sync.json');
const logPath = path.join(__dirname, '../logs/whatsapp-sync.log');
const pidPath = path.join(__dirname, '../.whatsapp-sync.pid');

// 確保日誌目錄存在
const logsDir = path.dirname(logPath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 日誌函數
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logPath, logMessage);
}

// 配置管理
class Config {
  constructor() {
    this.data = this.load();
  }

  load() {
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch (error) {
        log(`Failed to load config: ${error.message}`, 'ERROR');
        return this.getDefaults();
      }
    }
    return this.getDefaults();
  }

  getDefaults() {
    return {
      apiUrl: 'http://localhost:3000/api/trpc',
      userId: 1,
      syncInterval: 60000, // 每 60 秒同步一次
      groups: [], // 要監聽的群組 ID 列表
      maxRetries: 3,
      retryDelay: 5000,
    };
  }

  save() {
    fs.writeFileSync(configPath, JSON.stringify(this.data, null, 2));
  }
}

// WhatsApp 同步客戶端
class WhatsAppSyncClient {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.isRunning = false;
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      messagesProcessed: 0,
      quotationsFound: 0,
    };
  }

  async initialize() {
    try {
      log('Initializing WhatsApp client...');

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'watch-quotation-sync',
          dataPath: path.join(__dirname, '../.wwebjs_auth'),
        }),
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true,
        },
      });

      // QR 碼事件
      this.client.on(Events.QR_RECEIVED, (qr) => {
        log('QR Code received. Scan with WhatsApp:');
        qrcode.generate(qr, { small: true });
      });

      // 就緒事件
      this.client.on('ready', () => {
        log('WhatsApp client is ready!');
      });

      // 斷開連接事件
      this.client.on(Events.DISCONNECTED, () => {
        log('WhatsApp client disconnected', 'WARN');
        this.isRunning = false;
      });

      await this.client.initialize();
      log('WhatsApp client initialized successfully');
    } catch (error) {
      log(`Failed to initialize client: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async getGroups() {
    try {
      const chats = await this.client.getChats();
      const groups = chats
        .filter((chat) => chat.isGroup)
        .map((chat) => ({
          id: chat.id._serialized,
          name: chat.name,
        }));

      log(`Found ${groups.length} groups`);
      return groups;
    } catch (error) {
      log(`Failed to get groups: ${error.message}`, 'ERROR');
      return [];
    }
  }

  async exportGroupChats() {
    try {
      const groups = this.config.data.groups;
      if (groups.length === 0) {
        log('No groups configured for export');
        return [];
      }

      const chats = [];

      for (const groupId of groups) {
        try {
          const chat = await this.client.getChatById(groupId);
          if (chat.isGroup) {
            // 獲取最近的消息（防止導出過多消息）
            const messages = await chat.fetchMessages({ limit: 500 });

            // 構建聊天文本
            let chatText = `Group: ${chat.name}\n`;
            chatText += `Exported: ${new Date().toISOString()}\n`;
            chatText += '='.repeat(50) + '\n\n';

            for (const msg of messages.reverse()) {
              const date = new Date(msg.timestamp * 1000);
              const dateStr = date.toLocaleString('zh-HK');
              const author = msg.author || 'Unknown';
              chatText += `${dateStr} - ${author}: ${msg.body}\n`;
            }

            chats.push({
              groupId,
              groupName: chat.name,
              content: chatText,
              messageCount: messages.length,
            });

            log(`Exported ${messages.length} messages from group: ${chat.name}`);
          }
        } catch (error) {
          log(`Failed to export group ${groupId}: ${error.message}`, 'WARN');
        }
      }

      return chats;
    } catch (error) {
      log(`Failed to export chats: ${error.message}`, 'ERROR');
      return [];
    }
  }

  async uploadChats(chats) {
    if (chats.length === 0) {
      log('No chats to upload');
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const chat of chats) {
      try {
        // 轉換為 base64
        const base64Content = Buffer.from(chat.content).toString('base64');

        // 調用 API 上傳
        const response = await axios.post(
          `${this.config.data.apiUrl}/chatFiles.upload`,
          {
            filename: `${chat.groupName}-${Date.now()}.txt`,
            content: base64Content,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        if (response.data.result.data.success) {
          successCount++;
          log(`Uploaded chat from group: ${chat.groupName}`);
          this.syncStats.quotationsFound += response.data.result.data.parsedQuotations;
        } else {
          failedCount++;
          log(`Failed to upload chat from group: ${chat.groupName}`, 'WARN');
        }
      } catch (error) {
        failedCount++;
        log(`Error uploading chat from ${chat.groupName}: ${error.message}`, 'ERROR');
      }
    }

    return { success: successCount, failed: failedCount };
  }

  async sync() {
    try {
      this.syncStats.totalSyncs++;
      log('Starting sync cycle...');

      // 導出聊天
      const chats = await this.exportGroupChats();
      this.syncStats.messagesProcessed += chats.reduce((sum, c) => sum + c.messageCount, 0);

      // 上傳聊天
      const result = await this.uploadChats(chats);
      this.syncStats.successfulSyncs += result.success;
      this.syncStats.failedSyncs += result.failed;

      this.lastSyncTime = new Date();
      log(`Sync cycle completed. Uploaded ${result.success}/${chats.length} chats`);
    } catch (error) {
      this.syncStats.failedSyncs++;
      log(`Sync cycle failed: ${error.message}`, 'ERROR');
    }
  }

  async start() {
    if (this.isRunning) {
      log('Sync service is already running', 'WARN');
      return;
    }

    try {
      await this.initialize();
      this.isRunning = true;

      // 保存 PID
      fs.writeFileSync(pidPath, process.pid.toString());

      // 立即執行一次同步
      await this.sync();

      // 設置定時同步
      this.syncInterval = setInterval(async () => {
        await this.sync();
      }, this.config.data.syncInterval);

      log(`Sync service started. Interval: ${this.config.data.syncInterval}ms`);
    } catch (error) {
      log(`Failed to start sync service: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }

  async stop() {
    if (!this.isRunning) {
      log('Sync service is not running', 'WARN');
      return;
    }

    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }

      if (this.client) {
        await this.client.destroy();
      }

      this.isRunning = false;
      fs.unlinkSync(pidPath);
      log('Sync service stopped');
    } catch (error) {
      log(`Error stopping sync service: ${error.message}`, 'ERROR');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      stats: this.syncStats,
      config: this.config.data,
    };
  }
}

// 主程序
async function main() {
  const command = process.argv[2] || 'help';
  const config = new Config();

  const client = new WhatsAppSyncClient(config);

  switch (command) {
    case 'start':
      log('Starting WhatsApp sync service...');
      await client.start();
      // 保持進程運行
      process.on('SIGINT', async () => {
        log('Received SIGINT, shutting down...');
        await client.stop();
        process.exit(0);
      });
      break;

    case 'stop':
      log('Stopping WhatsApp sync service...');
      if (fs.existsSync(pidPath)) {
        try {
          const pid = parseInt(fs.readFileSync(pidPath, 'utf-8'));
          process.kill(pid);
          log('Sync service stopped');
        } catch (error) {
          log(`Failed to stop service: ${error.message}`, 'ERROR');
        }
      }
      break;

    case 'status':
      if (fs.existsSync(pidPath)) {
        try {
          const pid = parseInt(fs.readFileSync(pidPath, 'utf-8'));
          const status = client.getStatus();
          console.log(JSON.stringify(status, null, 2));
        } catch (error) {
          console.log('Sync service is not running');
        }
      } else {
        console.log('Sync service is not running');
      }
      break;

    case 'export':
      log('Performing manual export...');
      await client.initialize();
      const chats = await client.exportGroupChats();
      console.log(`Exported ${chats.length} group chats`);
      await client.stop();
      break;

    case 'config':
      console.log(JSON.stringify(config.data, null, 2));
      break;

    case 'set-groups':
      // 設置要監聽的群組
      const groups = process.argv.slice(3);
      config.data.groups = groups;
      config.save();
      log(`Configured groups: ${groups.join(', ')}`);
      break;

    default:
      console.log(`
WhatsApp Chat Auto-Sync Tool

Usage:
  node tools/whatsapp-sync-tool.mjs <command> [options]

Commands:
  start              Start the sync service
  stop               Stop the sync service
  status             Show sync service status
  export             Perform manual export
  config             Show current configuration
  set-groups <ids>   Set groups to monitor (space-separated)

Examples:
  node tools/whatsapp-sync-tool.mjs start
  node tools/whatsapp-sync-tool.mjs set-groups "120363123456789@g.us" "120363987654321@g.us"
  node tools/whatsapp-sync-tool.mjs status
      `);
      break;
  }
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'ERROR');
  process.exit(1);
});
