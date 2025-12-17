# Railway 雲端部署指南

## 概述

本指南將幫助您將整個手錶報價管理系統部署到 Railway，包括 Web 應用和 WhatsApp 自動同步工具。

## 優點

✅ 完全免費（Railway 免費額度）
✅ 24/7 自動運行
✅ 無需您的電腦一直開著
✅ 自動備份和恢復
✅ 實時監控和日誌
✅ 自動 SSL 證書

## 部署步驟

### 第一步：準備項目文件

確保您有以下文件（已為您創建）：

```
watch-quotation-system/
├── Dockerfile              ✅ 已創建
├── railway.json            ✅ 已創建
├── package.json
├── server/
├── client/
├── drizzle/
└── tools/
    └── whatsapp-sync-tool.mjs
```

### 第二步：上傳到 GitHub（可選但推薦）

如果您想自動部署，建議上傳到 GitHub：

1. 訪問 https://github.com/new
2. 創建新倉庫 `watch-quotation-system`
3. 上傳所有文件

或者使用命令行：

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/watch-quotation-system.git
git push -u origin main
```

### 第三步：在 Railway 上部署

#### 方法 1：從 GitHub（推薦）

1. 登錄 Railway：https://railway.app
2. 點擊「New Project」
3. 選擇「Deploy from GitHub repo」
4. 授權 GitHub 並選擇 `watch-quotation-system` 倉庫
5. Railway 會自動檢測 Dockerfile 並開始構建
6. 等待部署完成（5-10 分鐘）

#### 方法 2：直接上傳

1. 登錄 Railway
2. 點擊「New Project」
3. 選擇「Dockerfile」
4. 上傳項目文件夾
5. 點擊「Deploy」

### 第四步：配置環境變量

部署完成後，需要配置環境變量：

1. 在 Railway 項目中，點擊「Variables」
2. 添加以下環境變量：

```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_APP_TITLE=手錶報價管理系統
VITE_APP_LOGO=https://your-logo-url.png
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

**重要**：您需要從 Manus 項目設置中複製這些值。

### 第五步：配置數據庫

Railway 支持多種數據庫。推薦使用：

**選項 1：Railway 提供的 MySQL**（推薦）

1. 在 Railway 項目中，點擊「+ New」
2. 選擇「MySQL」
3. Railway 會自動生成 `DATABASE_URL`
4. 複製到環境變量中

**選項 2：使用現有數據庫**

如果您已有數據庫，直接設置 `DATABASE_URL`：

```
DATABASE_URL=mysql://user:password@host:port/database
```

### 第六步：獲取公開 URL

部署完成後，Railway 會為您生成一個公開 URL：

```
https://watch-quotation-system-prod.railway.app
```

訪問這個 URL 就可以使用您的系統！

### 第七步：配置 WhatsApp 同步工具

同步工具會自動在後台運行。要配置它：

1. 在 Railway 項目中，點擊「Deployments」
2. 查看日誌，會看到 QR 碼
3. 用手機 WhatsApp 掃描 QR 碼
4. 配置要監聽的群組

或者通過 Web 界面配置：

1. 訪問 `https://your-domain.com/sync`
2. 查看同步狀態
3. 配置群組

## 常見問題

### Q: 部署失敗了怎麼辦？

A: 檢查日誌：
1. 在 Railway 項目中，點擊「Deployments」
2. 查看最新部署的日誌
3. 查找錯誤信息
4. 常見錯誤：
   - 環境變量缺失 → 檢查 Variables 設置
   - 數據庫連接失敗 → 檢查 DATABASE_URL
   - 端口被佔用 → Railway 會自動分配

### Q: 如何查看日誌？

A: 
1. 在 Railway 項目中，點擊「Deployments」
2. 選擇最新的部署
3. 點擊「View Logs」
4. 實時查看應用日誌

### Q: 如何更新代碼？

A:
- 如果使用 GitHub：推送新代碼到 GitHub，Railway 會自動部署
- 如果直接上傳：重新上傳新文件並點擊「Redeploy」

### Q: 成本是多少？

A: **完全免費！**
- Railway 免費額度：$5/月（足夠了）
- 超出後自動停止，不會收費

### Q: 可以自定義域名嗎？

A: 可以！
1. 購買域名（例如 GoDaddy）
2. 在 Railway 中，點擊「Domains」
3. 添加自定義域名
4. 配置 DNS 記錄
5. 等待生效（5-30 分鐘）

### Q: WhatsApp 會被封禁嗎？

A: 風險很低，因為：
- 使用官方 WhatsApp Web 客戶端
- 每分鐘只導出一次（不頻繁）
- 建議使用專用 WhatsApp 賬號

### Q: 如何備份數據？

A: Railway 自動備份。要手動備份：
1. 在 Railway 中，點擊「MySQL」服務
2. 點擊「Backups」
3. 點擊「Create Backup」

### Q: 如何停止服務？

A: 
1. 在 Railway 項目中，點擊「Settings」
2. 點擊「Delete」
3. 確認刪除

## 監控和維護

### 查看實時狀態

訪問 `https://your-domain.com/sync` 查看：
- 同步狀態
- 成功率
- 已處理消息數
- 已提取報價數

### 查看應用日誌

1. 在 Railway 中，點擊「Deployments」
2. 選擇最新部署
3. 點擊「View Logs」

### 自動重啟

Railway 配置了自動重啟策略：
- 如果應用崩潰，自動重啟
- 最多重啟 5 次（每 60 秒）
- 防止無限重啟

## 性能優化

### 調整同步間隔

編輯 `config.whatsapp-sync.json`：

```json
{
  "syncInterval": 60000  // 改為 30000（30秒）或 120000（2分鐘）
}
```

### 限制消息數量

編輯 `tools/whatsapp-sync-tool.mjs`，找到：

```javascript
const messages = await chat.fetchMessages({ limit: 500 });
```

改為：

```javascript
const messages = await chat.fetchMessages({ limit: 200 }); // 減少消息數
```

### 數據庫優化

Railway 提供的 MySQL 已經優化，無需額外配置。

## 故障排除

### 問題 1：應用無法啟動

**症狀**：部署失敗，日誌顯示錯誤

**解決方案**：
1. 檢查 Dockerfile 是否正確
2. 檢查環境變量是否完整
3. 檢查依賴是否安裝成功

### 問題 2：數據庫連接失敗

**症狀**：日誌顯示 `ECONNREFUSED` 或 `ETIMEDOUT`

**解決方案**：
1. 檢查 DATABASE_URL 是否正確
2. 確保 MySQL 服務已啟動
3. 檢查防火牆設置

### 問題 3：WhatsApp 同步不工作

**症狀**：同步狀態顯示「已停止」或「錯誤」

**解決方案**：
1. 查看日誌中的詳細錯誤
2. 重新掃描 QR 碼登錄
3. 檢查群組 ID 是否正確

### 問題 4：內存占用過高

**症狀**：應用經常重啟或變慢

**解決方案**：
1. 減少同步間隔
2. 減少每次導出的消息數
3. 升級 Railway 計劃

## 下一步

1. **配置自定義域名**（可選）
   - 購買域名
   - 在 Railway 中配置

2. **設置告警通知**（可選）
   - 當同步失敗時發送通知
   - 集成 Slack/釘釘

3. **備份和恢復**
   - 定期備份數據庫
   - 測試恢復流程

4. **性能監控**
   - 定期查看日誌
   - 監控資源使用

## 支持

如遇到問題，請：

1. 查看 Railway 文檔：https://docs.railway.app
2. 查看應用日誌：Railway Dashboard → Deployments → View Logs
3. 檢查環境變量：Railway Dashboard → Variables
4. 聯繫 Railway 支持：https://railway.app/support

## 總結

恭喜！您已經成功部署了完整的手錶報價管理系統到 Railway。

現在您可以：
- ✅ 隨時訪問 Web 應用
- ✅ 自動同步 WhatsApp 聊天記錄
- ✅ 實時查看報價統計
- ✅ 管理黑名單
- ✅ 完全免費運行

祝您使用愉快！
