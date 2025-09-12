# Media Service

This service provides S3/MinIO-backed media uploads, download access, and on-the-fly image thumbnails.

## Endpoints

- POST `/uploads/presign`
  - body: `{ contentType: string; fileName?: string; key?: string; folder?: string; expiresInSeconds?: number }`
  - returns `{ url, method: 'PUT', key, headers }`

- POST `/uploads/confirm`
  - body: `{ key: string; returnPresignedGet?: boolean; expiresInSeconds?: number }`
  - returns `{ ok: true, key, contentType, contentLength, etag, lastModified, getUrl?, method?: 'GET' }`

- GET `/media/presign?key=...&expiresInSeconds=...`
  - returns `{ url, method: 'GET', key }`

- GET `/media/proxy?key=...`
  - streams the object via the service

- GET `/thumb?key=...&w=...&h=...&fit=cover|contain|fill|inside|outside&format=webp|jpeg|png|avif&q=80`
  - returns transformed image

## Local dev with docker-compose

```bash
# From repo root
docker compose -f docker-compose.media.yml up --build
```

MinIO console at `http://localhost:9001` (minioadmin/minioadmin).

## Environment

See `.env.example`.

Example values:

```
NODE_ENV=development
PORT=4008
CORS_ORIGIN=*
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=media
S3_FORCE_PATH_STYLE=true
```