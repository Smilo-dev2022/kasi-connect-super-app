# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.11.0

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
USER nodeuser
COPY --from=build /app/dist ./dist
COPY package*.json ./
ENTRYPOINT ["node", "dist/index.js"]

