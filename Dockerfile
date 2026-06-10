# ===== 前端构建 =====
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
RUN npm config set registry https://registry.npmmirror.com
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npx --yes tsc -b && npx --yes vite build

# ===== 后端构建 =====
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
RUN npm config set registry https://registry.npmmirror.com
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npx --yes tsc

# ===== Nginx 镜像：前端静态资源 =====
FROM nginx:alpine AS nginx-build
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
RUN rm -f /etc/nginx/conf.d/default.conf

# ===== 后端运行时 =====
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/package.json
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
