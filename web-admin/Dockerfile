# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.11.0

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
USER nodeuser
ENV PORT=3001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY package*.json ./
COPY next.config.mjs ./
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:${PORT}/ || exit 1
CMD ["npm", "run", "start"]

