FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY dist ./dist
EXPOSE 4008
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD node -e "fetch('http://127.0.0.1:4008/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" || exit 1
CMD ["node", "dist/server.js"]

FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm i
COPY tsconfig.json ./tsconfig.json
COPY src ./src
EXPOSE 4008
CMD ["npm", "run", "dev"]

