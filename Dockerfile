# Stage 1: Build stage
FROM node:22-alpine as builder

WORKDIR /build

COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install all dependencies (including dev) for building
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .

# Set build environment variables
ENV VITE_APP_ID=demo-watch-system
ENV VITE_APP_TITLE=手錶報價管理系統
ENV VITE_APP_LOGO=https://via.placeholder.com/200x200?text=Watch
ENV VITE_OAUTH_PORTAL_URL=https://portal.manus.im
ENV VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
ENV VITE_ANALYTICS_WEBSITE_ID=website-demo-123
ENV VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
ENV VITE_FRONTEND_FORGE_API_KEY=demo-key
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Stage 2: Runtime stage
FROM node:22-alpine

WORKDIR /app

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install ALL dependencies (including dev dependencies needed for runtime)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy built files from builder
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/drizzle ./drizzle

# Ensure dist/public exists
RUN mkdir -p dist/public

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
