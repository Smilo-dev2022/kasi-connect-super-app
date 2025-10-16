
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


## Developer Experience (Week 10–12)

Run all core services with one command for local development:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Services exposed locally:

- Messaging API: `http://localhost:8080`
- Events (Node): `http://localhost:3000`
- Wallet/Events (FastAPI): `http://localhost:8000`
- Moderation API: `http://localhost:8002`
- Media API (S3-compatible): `http://localhost:4008`
- MinIO console: `http://localhost:9001` (creds: `minioadmin` / `minioadmin`)
- Typesense: `http://localhost:8108` (API key: `xyz`)

Web app (Vite) dev server: `http://localhost:5173`.

Environment variables used by the web app are pre-wired by compose:

- `VITE_MSG_API=http://localhost:8080`
- `VITE_EVENTS_API=http://localhost:3000`
- `VITE_WALLET_API=http://localhost:8000`

### Mobile environment (Android/iOS)

The React Native app is under `iKasiLinkMobileApp/`.

Prereqs:

- Android Studio (SDK 35+) and/or Xcode 15+
- Java 17, Node 18+
- Watchman (macOS), CocoaPods for iOS (`sudo gem install cocoapods`)

Steps:

1. Start backend stack: `docker compose -f docker-compose.dev.yml up`
2. In a new terminal, from `iKasiLinkMobileApp/`:
   - Android: `npm run android`
   - iOS: `cd ios && pod install && cd .. && npm run ios`
3. Configure API base URLs via `react-native-config` (create `.env` in `iKasiLinkMobileApp/`):

```
API_BASE_URL=http://10.0.2.2:8080
SOCKET_URL=ws://10.0.2.2:8080
SENTRY_DSN=
```

Note: Use `10.0.2.2` for Android emulator to reach host localhost; on iOS simulator use `http://localhost`.

Optional (Expo Dev Client): You can integrate Expo Dev Client to simplify device testing without leaving bare native. If desired, install `expo` CLI and add the dev client following Expo docs, then run `expo run:android` or `expo run:ios`.




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
