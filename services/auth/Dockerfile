FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./

RUN npm i --silent

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
EXPOSE 4010
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget --quiet --spider http://127.0.0.1:4010/healthz || exit 1
CMD ["node", "dist/server.js"]

