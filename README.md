
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

## Local development (one command)

Run all core services (Redis, Typesense, Media, Messaging, Search, Events/Wallet, Moderation, Web) with live reload:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Then open the web app at http://localhost:5173. Messaging API runs at http://localhost:8080, Search at http://localhost:4009, Media at http://localhost:4008, Events/Wallet at http://localhost:8000, Moderation at http://localhost:8082.

### Mobile (optional)

- Android/iOS React Native app under `iKasiLinkMobileApp/`. Configure `.env` with `API_BASE_URL` and `SOCKET_URL` pointing to your host. Android Emulator uses `10.0.2.2` to reach the host.
- Consider Expo Dev Client for easier device testing; see the RN project README for setup.

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
