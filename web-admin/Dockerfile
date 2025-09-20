# syntax=docker/dockerfile:1.7-labs

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/.next/standalone /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/html
COPY --from=build /app/.next/static /usr/share/nginx/html/_next/static
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://127.0.0.1/ | grep -q '<html' || exit 1
