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

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache tini

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/package.json
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/database.sqlite
ENV STATIC_DIR=/app/frontend/dist
ENV CORS_ORIGINS=http://localhost

RUN mkdir -p /app/data

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/dist/index.js"]
