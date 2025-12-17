# Railway 快速開始指南

## 5 分鐘快速部署

### 第一步：準備（1 分鐘）

確保您有：
- ✅ Railway 賬號（已創建）
- ✅ 項目文件夾
- ✅ Dockerfile 和 railway.json（已為您創建）

### 第二步：上傳到 GitHub（2 分鐘）

**如果您沒有 Git，可以跳過這步，直接用 Railway 的上傳功能**

```bash
# 在項目文件夾中執行
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/watch-quotation-system.git
git push -u origin main
```

### 第三步：在 Railway 上部署（2 分鐘）

1. 訪問 https://railway.app
2. 登錄您的 Railway 賬號
3. 點擊「New Project」
4. 選擇「Deploy from GitHub repo」或「Dockerfile」
5. 選擇 `watch-quotation-system` 倉庫或上傳文件夾
6. 點擊「Deploy」
7. 等待 5-10 分鐘完成

### 第四步：獲取 URL

部署完成後，您會看到一個公開 URL：

```
https://watch-quotation-system-prod.railway.app
```

訪問這個 URL 就可以使用您的系統！

## 配置環境變量

部署後需要配置環境變量。在 Railway 中：

1. 點擊「Variables」
2. 添加以下變量（從 Manus 項目設置複製）：

| 變量名 | 說明 | 示例 |
|-------|------|------|
| DATABASE_URL | 數據庫連接字符串 | mysql://user:pass@host/db |
| JWT_SECRET | JWT 密鑰 | your-secret-key |
| VITE_APP_ID | Manus OAuth App ID | your-app-id |
| OAUTH_SERVER_URL | OAuth 服務器 URL | https://api.manus.im |
| OWNER_OPEN_ID | 所有者 ID | your-owner-id |
| OWNER_NAME | 所有者名稱 | Your Name |
| BUILT_IN_FORGE_API_KEY | API 密鑰 | your-api-key |
| VITE_APP_TITLE | 應用標題 | 手錶報價管理系統 |

## 配置數據庫

### 使用 Railway 提供的 MySQL（推薦）

1. 在 Railway 項目中，點擊「+ New」
2. 選擇「MySQL」
3. Railway 自動生成 `DATABASE_URL`
4. 複製到 Variables 中

### 使用現有數據庫

直接設置 `DATABASE_URL` 環境變量。

## 配置 WhatsApp 同步

### 方法 1：通過 Web 界面（推薦）

1. 訪問 `https://your-domain.com/sync`
2. 查看同步狀態
3. 掃描 QR 碼登錄 WhatsApp
4. 配置要監聽的群組

### 方法 2：通過環境變量

在 Railway Variables 中添加：

```
WHATSAPP_GROUPS=120363123456789@g.us,120363987654321@g.us
SYNC_INTERVAL=60000
```

## 查看日誌

在 Railway 中：

1. 點擊「Deployments」
2. 選擇最新部署
3. 點擊「View Logs」

## 常見問題

**Q: 部署失敗？**
A: 查看日誌找出錯誤，通常是環境變量缺失。

**Q: 應用很慢？**
A: 可能是首次啟動，需要下載 Chromium（~500MB）。

**Q: WhatsApp 同步不工作？**
A: 查看日誌，確保已掃描 QR 碼並配置群組。

**Q: 成本多少？**
A: 完全免費！Railway 免費額度足夠。

## 下一步

1. ✅ 部署應用
2. ✅ 配置環境變量
3. ✅ 配置數據庫
4. ✅ 配置 WhatsApp 同步
5. ✅ 訪問您的應用

完成後，您的系統就可以 24/7 自動運行了！

## 需要幫助？

查看完整指南：`RAILWAY_DEPLOYMENT_GUIDE.md`
