#!/usr/bin/env node

/**
 * WhatsApp Sync Service for Railway Deployment
 * 
 * This is a standalone service that runs independently from the Express server.
 * It connects to the WhatsApp Web API and syncs chat records to the main application.
 * 
 * Environment Variables:
 * - API_URL: URL to the main application API (e.g., https://watch-quotation-system-production.up.railway.app/api/trpc)
 * - SYNC_INTERVAL: Sync interval in milliseconds (default: 60000)
 * - USER_ID: User ID for API calls (default: 1)
 * - WHATSAPP_GROUPS: Comma-separated list of WhatsApp group IDs (optional)
 */

import { Client, LocalAuth, Events } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../logs');
const logPath = path.join(logsDir, 'whatsapp-sync.log');
const authDir = path.join(__dirname, '../.wwebjs_auth');

// Ensure directories exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  try {
    fs.appendFileSync(logPath, logMessage + '\n');
  } catch (e) {
    // Silently fail if we can't write to log file
  }
}

// Configuration from environment variables
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000/api/trpc',
  syncInterval: parseInt(process.env.SYNC_INTERVAL || '60000'),
  userId: parseInt(process.env.USER_ID || '1'),
  groups: process.env.WHATSAPP_GROUPS ? process.env.WHATSAPP_GROUPS.split(',').map(g => g.trim()) : [],
};

log(`Configuration loaded: API_URL=${config.apiUrl}, SYNC_INTERVAL=${config.syncInterval}ms`);

// WhatsApp Sync Service
class WhatsAppSyncService {
  constructor() {
    this.client = null;
    this.isRunning = false;
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.stats = {
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
          dataPath: authDir,
        }),
        puppeteer: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
          headless: true,
        },
      });

      // QR Code event
      this.client.on(Events.QR_RECEIVED, (qr) => {
        log('='.repeat(60));
        log('QR CODE RECEIVED - Scan with WhatsApp on your phone:');
        log('='.repeat(60));
        qrcode.generate(qr, { small: true });
        log('='.repeat(60));
      });

      // Ready event
      this.client.on('ready', () => {
        log('✅ WhatsApp client is ready!');
      });

      // Disconnected event
      this.client.on(Events.DISCONNECTED, () => {
        log('⚠️  WhatsApp client disconnected', 'WARN');
        this.isRunning = false;
      });

      // Error event
      this.client.on('error', (error) => {
        log(`WhatsApp client error: ${error.message}`, 'ERROR');
      });

      await this.client.initialize();
      log('✅ WhatsApp client initialized successfully');
      return true;
    } catch (error) {
      log(`Failed to initialize client: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async getAvailableGroups() {
    try {
      const chats = await this.client.getChats();
      const groups = chats
        .filter((chat) => chat.isGroup)
        .map((chat) => ({
          id: chat.id._serialized,
          name: chat.name,
        }));

      log(`Found ${groups.length} available groups`);
      return groups;
    } catch (error) {
      log(`Failed to get groups: ${error.message}`, 'ERROR');
      return [];
    }
  }

  async exportGroupChats() {
    try {
      const groupIds = config.groups.length > 0 ? config.groups : [];
      
      if (groupIds.length === 0) {
        log('No groups configured for export');
        return [];
      }

      const chats = [];

      for (const groupId of groupIds) {
        try {
          const chat = await this.client.getChatById(groupId);
          if (chat.isGroup) {
            // Fetch recent messages
            const messages = await chat.fetchMessages({ limit: 500 });

            // Build chat text
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
        // Convert to base64
        const base64Content = Buffer.from(chat.content).toString('base64');

        // Call API to upload
        const response = await axios.post(
          `${config.apiUrl}/chatFiles.upload`,
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

        if (response.data?.result?.data?.success) {
          successCount++;
          log(`✅ Uploaded chat from group: ${chat.groupName}`);
          this.stats.quotationsFound += response.data.result.data.parsedQuotations || 0;
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
      this.stats.totalSyncs++;
      log(`Starting sync cycle #${this.stats.totalSyncs}...`);

      // Export chats
      const chats = await this.exportGroupChats();
      this.stats.messagesProcessed += chats.reduce((sum, c) => sum + c.messageCount, 0);

      // Upload chats
      const result = await this.uploadChats(chats);
      this.stats.successfulSyncs += result.success;
      this.stats.failedSyncs += result.failed;

      this.lastSyncTime = new Date();
      log(`Sync cycle completed. Uploaded ${result.success}/${chats.length} chats. Stats: ${JSON.stringify(this.stats)}`);
    } catch (error) {
      this.stats.failedSyncs++;
      log(`Sync cycle failed: ${error.message}`, 'ERROR');
    }
  }

  async start() {
    if (this.isRunning) {
      log('Sync service is already running', 'WARN');
      return;
    }

    try {
      log('Starting WhatsApp Sync Service...');
      const initialized = await this.initialize();
      
      if (!initialized) {
        log('Failed to initialize WhatsApp client', 'ERROR');
        process.exit(1);
      }

      this.isRunning = true;

      // Perform initial sync
      log('Performing initial sync...');
      await this.sync();

      // Set up periodic sync
      this.syncInterval = setInterval(async () => {
        await this.sync();
      }, config.syncInterval);

      log(`✅ Sync service started. Sync interval: ${config.syncInterval}ms`);
      log(`Monitoring ${config.groups.length} groups`);

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        log('Received SIGINT, shutting down gracefully...');
        await this.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        log('Received SIGTERM, shutting down gracefully...');
        await this.stop();
        process.exit(0);
      });
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
      log('✅ Sync service stopped');
    } catch (error) {
      log(`Error stopping sync service: ${error.message}`, 'ERROR');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      stats: this.stats,
      config: {
        apiUrl: config.apiUrl,
        syncInterval: config.syncInterval,
        groupCount: config.groups.length,
        groups: config.groups,
      },
    };
  }
}

// Main entry point
async function main() {
  const service = new WhatsAppSyncService();
  await service.start();
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'ERROR');
  process.exit(1);
});
