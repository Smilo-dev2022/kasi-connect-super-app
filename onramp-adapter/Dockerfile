# 1. Install dependencies
FROM node:20-alpine as deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Use `npm ci` for consistent, faster installs in CI/CD
RUN npm ci

# 2. Build the application
FROM node:20-alpine as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Production image
FROM node:20-alpine as runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# The .env file should be mounted or managed by the container orchestrator in a real environment
# COPY .env .env
EXPOSE 4015
CMD ["node", "dist/index.js"]
