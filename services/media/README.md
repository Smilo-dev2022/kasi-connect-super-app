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

## Quickstart with cURL

1) Health check

```bash
curl -s http://localhost:4008/healthz | jq
```

2) Request a presigned PUT for an image

```bash
curl -s -X POST http://localhost:4008/uploads/presign \
  -H 'Content-Type: application/json' \
  -d '{
    "contentType":"image/png",
    "fileName":"example.png",
    "folder":"uploads"
  }'
```

Response example:

```json
{
  "url": "http://localhost:9000/media/uploads/173...",
  "method": "PUT",
  "key": "uploads/173...-example.png",
  "headers": { "Content-Type": "image/png" }
}
```

3) Upload the file to S3/MinIO using the presigned URL

```bash
# Assuming you saved the url and key into shell vars
URL="<presigned_put_url>"
KEY="<returned_key>"
curl -s -X PUT -H 'Content-Type: image/png' --data-binary @example.png "$URL" -o /dev/null -w '%{http_code}\n'
```

4) Get a presigned GET URL to download

```bash
curl -s "http://localhost:4008/media/presign?key=${KEY}&expiresInSeconds=600" | jq
```

5) Stream via the service proxy

```bash
curl -s "http://localhost:4008/media/proxy?key=${KEY}" -o downloaded.png
```

6) Generate a thumbnail (webp 256x256 cover)

```bash
curl -s "http://localhost:4008/thumb?key=${KEY}&w=256&h=256&fit=cover&format=webp&q=80" -o thumb.webp
```