# syntax=docker/dockerfile:1
# Fly.io single container: Postgres + Redis + NestJS API + nginx (no Docker-in-Docker).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --include-workspace-root

FROM node:20-alpine AS build-api
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend ./backend
RUN npm run build -w @spiny-wheely/backend

FROM node:20-alpine AS build-web
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY frontend ./frontend
ENV VITE_API_URL=
RUN npm run build -w @spiny-wheely/frontend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache \
    bash \
    curl \
    nginx \
    redis \
    postgresql16 \
    postgresql16-contrib \
    su-exec \
  && mkdir -p /run/nginx /run/postgresql /var/log/postgresql \
  && addgroup -S spiny && adduser -S spiny -G spiny \
  && chown -R spiny:spiny /run/nginx

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build-api /app/backend/dist ./backend/dist
COPY --from=build-api /app/backend/package.json ./backend/package.json
COPY --from=build-web /app/frontend/dist ./frontend/dist
COPY package.json ./
COPY deploy/fly/nginx.conf /etc/nginx/http.d/default.conf
COPY deploy/fly/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD curl -f http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
