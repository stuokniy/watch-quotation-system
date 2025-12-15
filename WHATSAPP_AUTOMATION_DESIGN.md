# WhatsApp Web 自動化 - 多群組實時同步設計

## 需求分析

- **群組數量**: 幾十個報價群組
- **同步方式**: 實時監聽所有群組
- **數據量**: 每個群組可能有大量消息
- **性能要求**: 不能阻塞主服務，需要後台運行

## 架構設計

### 1. 系統架構

```
┌─────────────────────────────────────────────────────────┐
│                    主應用服務                              │
│  (React + Express + tRPC)                              │
└────────────┬────────────────────────────────────────────┘
             │
             │ 通過 Worker Process 通信
             ▼
┌─────────────────────────────────────────────────────────┐
│            WhatsApp 自動化服務（獨立進程）                  │
│  - WhatsApp Web 客戶端                                   │
│  - 多群組監聽管理器                                       │
│  - 消息隊列和批量處理                                     │
└────────────┬────────────────────────────────────────────┘
             │
             │ 存儲同步消息
             ▼
┌─────────────────────────────────────────────────────────┐
│                    數據庫                                 │
│  - 群組配置表                                            │
│  - 同步狀態表                                            │
│  - 消息緩存表                                            │
│  - 報價表（自動解析）                                    │
└─────────────────────────────────────────────────────────┘
```

### 2. 核心模塊

#### 2.1 WhatsApp Web 客戶端管理
```typescript
class WhatsAppClient {
  // 初始化客戶端
  async initialize()
  
  // 獲取所有群組
  async getGroups()
  
  // 監聽特定群組消息
  async watchGroup(groupId, callback)
  
  // 停止監聽
  async stopWatching()
}
```

#### 2.2 多群組監聽管理器
```typescript
class MultiGroupListener {
  // 添加要監聽的群組
  async addGroup(groupId, groupName)
  
  // 移除群組監聽
  async removeGroup(groupId)
  
  // 獲取監聽狀態
  getStatus()
  
  // 批量處理消息
  async processBatch(messages)
}
```

#### 2.3 消息處理管線
```
消息接收 → 去重 → 解析報價 → 存儲 → 通知前端
   ↓
消息隊列（Redis/內存）
   ↓
批量處理（減少數據庫寫入）
```

### 3. 數據庫設計

#### groups 表（群組配置）
```sql
CREATE TABLE groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  groupId VARCHAR(255) UNIQUE NOT NULL,
  groupName VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  lastSyncTime TIMESTAMP,
  messageCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX userId_idx (userId)
);
```

#### sync_status 表（同步狀態）
```sql
CREATE TABLE sync_status (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  groupId VARCHAR(255) NOT NULL,
  status ENUM('running', 'paused', 'error') DEFAULT 'running',
  lastMessage TIMESTAMP,
  errorMessage TEXT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_group (userId, groupId)
);
```

#### message_cache 表（消息緩存）
```sql
CREATE TABLE message_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  groupId VARCHAR(255) NOT NULL,
  messageId VARCHAR(255) UNIQUE NOT NULL,
  senderName VARCHAR(100),
  senderPhone VARCHAR(50),
  messageText TEXT,
  timestamp DATETIME,
  hasQuotation BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX userId_groupId_idx (userId, groupId),
  INDEX timestamp_idx (timestamp)
);
```

### 4. 實現流程

#### 4.1 初始化階段
1. 用戶掃描二維碼登錄 WhatsApp
2. 系統自動發現所有群組
3. 用戶選擇要監聽的群組
4. 保存群組配置到數據庫

#### 4.2 運行階段
1. 後台服務啟動 WhatsApp Web 客戶端
2. 連接到所有配置的群組
3. 實時監聽消息事件
4. 消息進入隊列進行批量處理
5. 解析報價並存儲到數據庫
6. 通過 WebSocket 通知前端新報價

#### 4.3 故障恢復
1. 連接斷開時自動重連
2. 記錄同步狀態和錯誤日誌
3. 支持手動重啟同步
4. 消息去重防止重複處理

### 5. 性能優化

#### 5.1 資源管理
- **內存管理**: 使用消息隊列限制內存占用
- **CPU優化**: 批量處理減少數據庫寫入次數
- **連接管理**: 複用 WhatsApp 連接，避免多次登錄

#### 5.2 數據庫優化
- **批量插入**: 每 100 條消息批量寫入一次
- **索引優化**: 在 userId、groupId、timestamp 上建立索引
- **消息去重**: 使用 messageId 作為唯一鍵

#### 5.3 可擴展性
- **進程隔離**: WhatsApp 服務運行在獨立進程
- **消息隊列**: 支持後期升級到 Redis/RabbitMQ
- **水平擴展**: 支持多個 WhatsApp 賬號並行運行

### 6. 前端集成

#### 6.1 群組管理頁面
- 顯示所有可用群組
- 選擇要監聽的群組
- 查看同步狀態

#### 6.2 實時通知
- WebSocket 連接
- 新報價實時推送
- 同步狀態更新

#### 6.3 監控儀表板
- 同步進度
- 群組狀態
- 報價統計
- 錯誤日誌

### 7. 部署建議

#### 7.1 本地部署
```bash
# 啟動主應用
npm start

# 啟動 WhatsApp 自動化服務（另一個終端）
npm run whatsapp:service
```

#### 7.2 雲端部署
- 使用 Docker 容器化
- WhatsApp 服務運行在單獨的容器
- 使用 Docker Compose 編排

### 8. 成本估算

| 組件 | 成本 | 說明 |
|------|------|------|
| 前端託管 | $0-20/月 | Vercel |
| 後端服務器 | $5-20/月 | Railway/Render |
| 數據庫 | $5-30/月 | PlanetScale/TiDB |
| WhatsApp 服務 | $0 | 無額外成本 |
| **總計** | **$10-70/月** | 根據規模調整 |

### 9. 注意事項

1. **WhatsApp 政策**: WhatsApp 不允許自動化工具，可能導致賬號被封。建議：
   - 使用專用賬號
   - 避免過度頻繁的操作
   - 定期監控賬號狀態

2. **穩定性**: WhatsApp Web 可能因版本更新而失效，需要定期維護

3. **隱私**: 確保用戶同意數據收集和存儲

### 10. 實現時間表

| 階段 | 任務 | 時間 |
|------|------|------|
| 1 | 設計和架構 | 1-2 天 |
| 2 | 實現 WhatsApp 客戶端 | 2-3 天 |
| 3 | 多群組管理器 | 2-3 天 |
| 4 | 前端集成 | 2-3 天 |
| 5 | 測試和優化 | 2-3 天 |
| **總計** | | **9-14 天** |

## 下一步

1. 確認是否接受 WhatsApp 政策風險
2. 決定是否需要多賬號支持
3. 確認群組數量和消息量預期
4. 開始實現第一階段
