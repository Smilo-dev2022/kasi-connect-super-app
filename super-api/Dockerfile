# Dev-oriented Dockerfile
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
# Install dependencies first
COPY package.json package-lock.json ./
RUN npm ci
# Copy source
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts
# Generate Prisma client if schema present
RUN npx prisma generate || true
EXPOSE 8081
CMD ["npm","run","dev"]

# Production build (optional)
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npm run build && npx prisma generate || true

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
ENV PORT=8081 HOST=0.0.0.0
EXPOSE 8081
CMD ["node","dist/index.js"]
