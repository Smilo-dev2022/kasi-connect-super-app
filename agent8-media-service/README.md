Agent 8 – Media Service

Fastify + TypeScript service for media uploads to S3/MinIO with presigned upload URLs, on-demand image thumbnail generation using Sharp, and fetch APIs.

Features
- Presigned PUT upload for images (jpeg/png/webp) and PDFs
- On-demand thumbnail generation for images
- Fetch APIs: list files, get file URLs, get thumbnail URLs, HEAD metadata

Endpoints
- POST `/uploads/presign` → `{ contentType, filename?, folder? }`
- GET `/files?prefix=&max=`
- GET `/files/url?key=`
- GET `/thumbnails/url?key=`
- GET `/files/head?key=`
- GET `/health`

Setup
1. Copy `.env.example` to `.env` and adjust values
2. Install deps: `npm i`
3. Start dev: `npm run dev`

Upload flow
1. Client calls `/uploads/presign` with content type and optional filename/folder
2. Client uploads directly to S3 using returned `uploadUrl` and `Content-Type` header
3. For images, call `/thumbnails/url?key=...` later to get or generate a thumbnail URL

Notes
- Ensure the bucket exists and credentials/user have permissions to PutObject/GetObject/ListBucket
- For MinIO, set `S3_FORCE_PATH_STYLE=true` and `S3_USE_SSL=false`
