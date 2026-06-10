# ===== 前端构建（用完整 Debian 镜像，避免 Alpine 兼容问题）=====
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
RUN npm config set registry https://registry.npmmirror.com
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ===== 后端构建 =====
FROM node:20-slim AS backend-build
WORKDIR /app/backend
RUN npm config set registry https://registry.npmmirror.com
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# ===== Nginx 镜像：前端静态资源 =====
FROM nginx:alpine AS nginx-build
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
RUN rm -f /etc/nginx/conf.d/default.conf

# ===== 后端运行时：重新安装生产依赖（Alpine，体积小）=====
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm config set registry https://registry.npmmirror.com && npm install --omit=dev
WORKDIR /app
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_HOST=172.25.60.241
ENV DB_PORT=3306
ENV DB_USER=my_web_db
ENV DB_PASSWORD=666888
ENV DB_NAME=my_web_db
ENV STATIC_DIR=/app/frontend/dist
ENV CORS_ORIGINS=*

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
