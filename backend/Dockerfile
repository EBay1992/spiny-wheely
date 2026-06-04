# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
RUN npm ci --workspace=@spiny-wheely/backend --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend ./backend
RUN npm run build -w @spiny-wheely/backend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl \
  && addgroup -S spiny && adduser -S spiny -G spiny
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY package.json ./
USER spiny
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/health || exit 1
CMD ["node", "backend/dist/main.js"]
