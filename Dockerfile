FROM node:22-alpine

# 安裝必要的系統依賴
RUN apk add --no-cache \
    chromium \
    ca-certificates \
    dbus \
    ttf-freefont \
    font-noto-cjk

# 設置工作目錄
WORKDIR /app

# 複製 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# 安裝依賴
RUN npm install --legacy-peer-deps

# 複製項目文件
COPY . .

# 設置構建時的環境變量（這些是必需的）
ENV VITE_APP_ID=demo-watch-system
ENV VITE_APP_TITLE=手錶報價管理系統
ENV VITE_APP_LOGO=https://via.placeholder.com/200x200?text=Watch
ENV VITE_OAUTH_PORTAL_URL=https://portal.manus.im
ENV VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
ENV VITE_ANALYTICS_WEBSITE_ID=website-demo-123
ENV VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
ENV VITE_FRONTEND_FORGE_API_KEY=demo-key

# 構建前端
RUN npm run build

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["npm", "start"]
