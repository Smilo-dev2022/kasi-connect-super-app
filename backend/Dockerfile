# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.11.0

FROM node:${NODE_VERSION}-alpine AS base
ENV NODE_ENV=production

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runtime
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
USER nodeuser
ENV PORT=4000
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:${PORT}/health | grep -q 'ok' || exit 1
CMD ["node", "dist/index.js"]

