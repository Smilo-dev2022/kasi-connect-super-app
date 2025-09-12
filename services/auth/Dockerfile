FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY dist ./dist
EXPOSE 4010
CMD ["node", "dist/server.js"]

FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm i
COPY tsconfig.json ./tsconfig.json
COPY src ./src
EXPOSE 4010
CMD ["npm", "run", "dev"]

