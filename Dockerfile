FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# nginx 镜像：包含前端构建产物，用于直接提供静态资源
FROM nginx:alpine AS nginx-build
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
RUN rm -f /etc/nginx/conf.d/default.conf

# 后端应用镜像
FROM node:20-alpine AS production
WORKDIR /app
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache tini

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/package.json
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_HOST=host.docker.internal
ENV DB_PORT=3306
ENV DB_USER=admin
ENV DB_PASSWORD=
ENV DB_NAME=my_web_db
ENV STATIC_DIR=/app/frontend/dist
ENV CORS_ORIGINS=http://localhost

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/dist/index.js"]
