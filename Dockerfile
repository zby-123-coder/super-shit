# ============ 构建阶段 ============
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json nest-cli.json vite.config.ts ./
COPY shared ./shared
COPY client ./client
COPY server ./server
RUN npm run build

# ============ 运行阶段 ============
# Nest 同时服务 /api 与 dist/client 静态文件，单容器一个域名搞定
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
# 打卡图片本地落盘目录（重启会丢；接 COS 后改 OSS_STORAGE 即可，代码已留口子）
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "dist/server/main.js"]
