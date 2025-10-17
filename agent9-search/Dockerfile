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
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD node -e "fetch('http://127.0.0.1:4009/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" || exit 1

CMD ["npm", "start"]
