
# iKasiLink Project

![iKasiLink Logo](ikasilink.logo.png.png)

## Events Service (FastAPI)

### Quickstart

If venv creation fails due to ensurepip being unavailable, install `python3.13-venv` using apt.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip wheel setuptools
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Then open `http://localhost:8000/` for the UI stub.

### API

- GET `/events/`
- POST `/events/`
- GET `/events/{id}`
- PATCH `/events/{id}`
- DELETE `/events/{id}`
- POST `/events/seed`
- POST `/events/{event_id}/rsvps`
- GET `/events/{event_id}/rsvps`
- POST `/rsvps`
- GET `/rsvps/{id}`
- PATCH `/rsvps/{id}`
- DELETE `/rsvps/{id}`
- POST `/reminders/queue-upcoming`

### Notes

- SQLite database at `events.db`
- Models: `Event`, `RSVP` (SQLModel)
- Minimal static UI lists events and allows RSVP

## Super API (Node.js + Express + Prisma + Socket.IO)

The new `super-api` consolidates compatibility endpoints for Events and Wallet, and provides realtime hooks via Socket.IO.

### Quickstart

```bash
# Start dev stack (includes super-api on port 8081)
docker compose -f docker-compose.dev.yml up

# Or run locally
cd super-api
npm i
npx prisma migrate dev -n init
npm run dev
```

### Environment

`super-api/.env.example`:

```env
PORT=8081
NODE_ENV=development
DATABASE_URL="file:./dev.db"
ALLOWED_ORIGINS=*
# Optional S3 (local MinIO via compose)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=media
S3_FORCE_PATH_STYLE=true
```

### Endpoints

- Events compatibility
  - GET `/api/events`
  - GET `/api/events/:slug`
  - POST `/api/events/:slug/rsvp` { name, email }
  - GET `/api/tickets/:ticketId`
  - GET `/checkin/verify?token=...`
  - POST `/checkin` { token }

- Wallet
  - GET `/api/mobile/balance/:userId` — current balance by user
  - GET `/api/wallet/:accountId/transactions.csv` — CSV export
  - POST `/api/transactions` { accountId, amount, type: CREDIT|DEBIT, description? }

- Realtime
  - Socket.IO server on the same port (8081). Emits `wallet:transaction` on new transactions.

### Data model

Prisma models include `Event`, `Rsvp`, `Ticket`, `Account`, and `Transaction` (SQLite in dev).

## Dev environment changes

- Messaging API port updated to 8081. Frontend now reads `VITE_MSG_API=http://localhost:8081` in dev compose.
- Mobile app `.env` updated:
  ```env
  API_BASE_URL=http://localhost:8081
  SOCKET_URL=ws://localhost:8081
  ```
- `docker-compose.dev.yml`:
  - Removed `agent7-messaging`
  - Added `super-api` on 8081 (runs Prisma migrate then starts)
- `docker-compose.prod.yml`:
  - Standardized Postgres service name to `db`
  - Updated `DATABASE_URL`/`EVENTS_DATABASE_URL`/`MOD_DB_URL` to use `@db:5432`

## Install/Build updates

- Root workspaces now include `super-api`
- Installed in `super-api`:
  - `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (S3/MinIO support)
  - `socket.io` (realtime)
  - `@prisma/client`/`prisma` (ORM)

## Project info (iKasiLink)


**Website**: [https://ikasilink.co.za](https://ikasilink.co.za)


### Use your preferred IDE

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh

# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the iKasiLink project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the iKasiLink development server with auto-reloading and an instant preview.
npm run dev
```



### Edit a file directly in GitHub (iKasiLink)

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.



### Use GitHub Codespaces (iKasiLink)

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.


## Deployment quickstart

- Prepare env files from `*.env.example` per service.
- Build and push images:
```bash
./scripts/build-images.sh
./scripts/push-images.sh
```
- Configure Terraform backend in `infra/backend.tf`, then provision VPC/ECR/EKS/RDS:
```bash
cd infra && terraform init && terraform apply -auto-approve
```
- Deploy to Kubernetes with Helm (see `runbooks/deploy-rollback.md`).

## What technologies are used for iKasiLink?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


## Search service (Agent 9)

The app includes a simple web search page at \/app\/search with tabs for Text, Media, and Links.

### Providers

- Primary: SerpAPI (Google \/ Google Images)
- Fallback: DuckDuckGo redirect links (client-side friendly)

### Environment

To enable SerpAPI, set the following in your environment:

\u0060\u0060\u0060sh
VITE_SERPAPI_KEY=your_serpapi_key
\u0060\u0060\u0060


---

© 2025 Kasi Connect KC Pty Ltd. All rights reserved. Visit us at [https://ikasilink.co.za](https://ikasilink.co.za)
