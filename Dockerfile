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

# 構建前端
RUN npm run build

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["npm", "start"]
