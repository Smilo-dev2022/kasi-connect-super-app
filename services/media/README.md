# Media Service

This service provides S3/MinIO-backed media uploads, download access, and on-the-fly image thumbnails.

## Endpoints

- POST `/uploads/presign`
  - body: `{ contentType: string; fileName?: string; key?: string; folder?: string; expiresInSeconds?: number }`
  - returns `{ url, method: 'PUT', key, headers }`

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

## Security

- Set `ENFORCE_HTTPS=true` in production to force HTTPS via reverse proxy headers.
- Security headers are applied via Helmet.