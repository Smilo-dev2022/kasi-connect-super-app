FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* bun.lockb* yarn.lock* ./
RUN npm ci || npm i

COPY tsconfig.json ./tsconfig.json
COPY src ./src
COPY scripts ./scripts

RUN npm run build

ENV NODE_ENV=production
ENV PORT=4009

EXPOSE 4009
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget --quiet --spider http://127.0.0.1:4009/health || exit 1

CMD ["npm", "start"]
