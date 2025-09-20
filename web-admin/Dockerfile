# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY web-admin/package.json web-admin/package-lock.json* ./
RUN npm install

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web-admin/ . .

# Set build-time arguments for Next.js
ARG NEXT_PUBLIC_EVENTS_API_BASE
ARG NEXT_PUBLIC_MOD_API_BASE

# Set environment variables for the build process
ENV NEXT_PUBLIC_EVENTS_API_BASE=$NEXT_PUBLIC_EVENTS_API_BASE
ENV NEXT_PUBLIC_MOD_API_BASE=$NEXT_PUBLIC_MOD_API_BASE

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built assets from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
