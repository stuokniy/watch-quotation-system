# WhatsApp 每分鐘自動同步工具 - 使用指南

## 概述

這個工具可以每分鐘自動導出 WhatsApp 聊天記錄並上傳到系統，自動解析報價信息。相比 WhatsApp Web 自動化方案，這個方案更加安全、穩定和易於維護。

## 工作原理

```
┌─────────────────────────────────────────────────────────┐
│ 每分鐘執行一次                                             │
├─────────────────────────────────────────────────────────┤
│ 1. 連接 WhatsApp Web                                    │
│ 2. 導出指定群組的最近 500 條消息                          │
│ 3. 轉換為聊天記錄文本                                     │
│ 4. 上傳到系統 API                                        │
│ 5. 系統自動解析報價並去重                                 │
│ 6. 前端實時顯示新報價                                     │
└─────────────────────────────────────────────────────────┘
```

## 安裝和配置

### 1. 安裝依賴

```bash
cd /home/ubuntu/watch-quotation-system
pnpm install
```

### 2. 複製配置文件

```bash
cp config.whatsapp-sync.json.example config.whatsapp-sync.json
```

### 3. 編輯配置文件

編輯 `config.whatsapp-sync.json`：

```json
{
  "apiUrl": "http://localhost:3000/api/trpc",
  "userId": 1,
  "syncInterval": 60000,
  "groups": [
    "120363123456789@g.us",
    "120363987654321@g.us"
  ],
  "maxRetries": 3,
  "retryDelay": 5000
}
```

**配置說明：**
- `apiUrl`: 系統 API 地址（本地開發時使用 localhost）
- `userId`: 用戶 ID（對應數據庫中的用戶）
- `syncInterval`: 同步間隔（毫秒），默認 60000 = 1 分鐘
- `groups`: 要監聽的 WhatsApp 群組 ID 列表
- `maxRetries`: 失敗重試次數
- `retryDelay`: 重試延遲（毫秒）

## 使用方法

### 啟動同步服務

```bash
node tools/whatsapp-sync-tool.mjs start
```

首次運行時，會出現 QR 碼，用 WhatsApp 掃描登錄：

```
QR Code received. Scan with WhatsApp:
█████████████████████████████████████
█ ▄▄▄▄▄ █▀ ▀██▀▀▀ ▀█ ▄▄▄▄▄ █
█ █   █ █▀▀▄▀█▀▀▀▄ █ █   █ █
█ █▄▄▄█ █▀▀▄▀ ▀▀▀▀ █ █▄▄▄█ █
█▄▄▄▄▄▄▄█ ▀ █ ▀ █ █▄▄▄▄▄▄▄█
█▀▀▀▀▀█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█▄▄▄▄▄█ ▀ ▀▀▀▀ ▀ ▀▀▀▀▀▀▀▀█
█████████████████████████████████████
```

### 配置監聽群組

首先，獲取要監聽的群組 ID。可以通過以下方式：

```bash
# 導出一次並查看群組信息
node tools/whatsapp-sync-tool.mjs export
```

然後配置群組：

```bash
node tools/whatsapp-sync-tool.mjs set-groups "120363123456789@g.us" "120363987654321@g.us"
```

### 查看同步狀態

```bash
node tools/whatsapp-sync-tool.mjs status
```

輸出示例：

```json
{
  "isRunning": true,
  "lastSyncTime": "2024-12-03T10:30:45.123Z",
  "stats": {
    "totalSyncs": 42,
    "successfulSyncs": 40,
    "failedSyncs": 2,
    "messagesProcessed": 1250,
    "quotationsFound": 156
  },
  "config": {
    "syncInterval": 60000,
    "groups": ["120363123456789@g.us"]
  }
}
```

### 停止同步服務

```bash
node tools/whatsapp-sync-tool.mjs stop
```

### 手動導出一次

```bash
node tools/whatsapp-sync-tool.mjs export
```

### 查看當前配置

```bash
node tools/whatsapp-sync-tool.mjs config
```

## 日誌和監控

### 查看日誌

日誌文件位於 `logs/whatsapp-sync.log`：

```bash
tail -f logs/whatsapp-sync.log
```

日誌示例：

```
[2024-12-03T10:30:00.000Z] [INFO] Starting sync cycle...
[2024-12-03T10:30:02.123Z] [INFO] Exported 45 messages from group: 手錶報價群1
[2024-12-03T10:30:03.456Z] [INFO] Uploaded chat from group: 手錶報價群1
[2024-12-03T10:30:04.789Z] [INFO] Sync cycle completed. Uploaded 1/1 chats
```

### 前端監控儀表板

訪問 http://localhost:3000/sync 查看實時同步狀態：

- 總同步次數
- 成功率
- 已處理消息數
- 已提取報價數
- 監聽群組列表
- 最後同步時間

## 部署到生產環境

### 使用 PM2 管理進程

```bash
# 安裝 PM2
npm install -g pm2

# 啟動服務
pm2 start tools/whatsapp-sync-tool.mjs --name "whatsapp-sync"

# 開機自啟
pm2 startup
pm2 save

# 查看狀態
pm2 status

# 查看日誌
pm2 logs whatsapp-sync
```

### 使用 Docker

創建 `Dockerfile.sync`：

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "tools/whatsapp-sync-tool.mjs", "start"]
```

構建和運行：

```bash
docker build -f Dockerfile.sync -t whatsapp-sync .
docker run -d \
  --name whatsapp-sync \
  -v $(pwd)/config.whatsapp-sync.json:/app/config.whatsapp-sync.json \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/.wwebjs_auth:/app/.wwebjs_auth \
  whatsapp-sync
```

### 使用 systemd 服務

創建 `/etc/systemd/system/whatsapp-sync.service`：

```ini
[Unit]
Description=WhatsApp Chat Auto-Sync Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/watch-quotation-system
ExecStart=/usr/bin/node tools/whatsapp-sync-tool.mjs start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

啟動服務：

```bash
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-sync
sudo systemctl start whatsapp-sync
sudo systemctl status whatsapp-sync
```

## 故障排除

### 問題 1：QR 碼掃描失敗

**症狀**: 掃描 QR 碼後沒有反應

**解決方案**:
1. 確保 WhatsApp 已安裝在手機上
2. 確保網絡連接正常
3. 嘗試清除認證緩存：`rm -rf .wwebjs_auth`
4. 重新啟動工具

### 問題 2：無法連接到 API

**症狀**: 上傳時出現連接錯誤

**解決方案**:
1. 檢查 API 服務是否運行：`pnpm dev`
2. 檢查 `config.whatsapp-sync.json` 中的 `apiUrl` 是否正確
3. 檢查防火牆設置

### 問題 3：內存占用過高

**症狀**: 工具運行一段時間後內存持續增長

**解決方案**:
1. 減少 `syncInterval`（更頻繁的同步可能導致內存積累）
2. 減少每次導出的消息數（修改代碼中的 `limit: 500`）
3. 定期重啟服務

### 問題 4：報價沒有被解析

**症狀**: 消息已導出但沒有提取報價

**解決方案**:
1. 檢查消息格式是否符合解析規則
2. 查看日誌中的詳細錯誤信息
3. 手動測試解析器：在搜索頁面上傳包含報價的聊天文件

## 性能優化建議

### 1. 優化同步間隔

- 對於活躍群組：60 秒（默認）
- 對於不活躍群組：300 秒（5 分鐘）
- 對於超活躍群組：30 秒

### 2. 優化消息數量

修改 `whatsapp-sync-tool.mjs` 中的消息限制：

```javascript
const messages = await chat.fetchMessages({ limit: 500 }); // 調整此值
```

- 更多消息 = 更完整的歷史，但更慢
- 更少消息 = 更快，但可能遺漏舊報價

### 3. 批量上傳

如果有多個群組，考慮批量上傳以減少 API 調用次數。

## 安全建議

1. **不要在公開環境中運行** - 工具需要訪問 WhatsApp 賬號
2. **保護配置文件** - `config.whatsapp-sync.json` 包含敏感信息
3. **定期檢查日誌** - 監控異常活動
4. **使用專用賬號** - 建議使用專門的 WhatsApp 賬號用於同步
5. **啟用日誌輪轉** - 防止日誌文件過大

## 常見問題

**Q: 工具會被 WhatsApp 封禁嗎？**
A: 風險較低，因為我們使用的是官方 WhatsApp Web 客戶端。但建議：
- 使用專用賬號
- 避免過度頻繁的操作
- 定期檢查賬號狀態

**Q: 可以監聽多少個群組？**
A: 理論上無限制，但受到內存和 CPU 限制。建議不超過 50 個群組。

**Q: 同步延遲是多少？**
A: 通常 1-3 分鐘（取決於網絡和消息量）。

**Q: 可以同時運行多個實例嗎？**
A: 不建議。多個實例可能導致重複導出。如需高可用，使用 PM2 集群模式。

## 技術支持

如遇到問題，請檢查：
1. 日誌文件：`logs/whatsapp-sync.log`
2. 配置文件：`config.whatsapp-sync.json`
3. 網絡連接
4. API 服務狀態

## 更新日誌

### v1.0.0 (2024-12-03)
- 初始版本
- 支持每分鐘自動同步
- 支持多群組監聽
- 包含完整的監控儀表板
