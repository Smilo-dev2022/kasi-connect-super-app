# Township Messenger Monorepo

This workspace contains all services and apps for the township messenger project.

## Packages

- `backend`: TypeScript Fastify service (HTTP + WebSocket) with Postgres and Redis clients
- `web-admin`: Next.js admin dashboard for ward verification and operations
- `mobile/android`: Android app shell (Kotlin) with libsignal integration (planned)
- `mobile/ios`: iOS app shell (Swift) with libsignal integration (planned)
- `infra`: Infrastructure as code (Docker Compose for local, Terraform skeleton)
- `docs`: Documentation

## Quick start (local, minimal)

1. Copy `.env.example` to `.env` and adjust if needed
2. Start services (Postgres, Redis, MinIO) once `docker-compose.yml` is added
3. Backend: `cd backend && npm install && npm run dev`
4. Web-admin: `cd web-admin && npm install && npm run dev`

See `docs/SETUP.md` for details.

# Welcome to the Kasi chat Project

## Project info

**URL**:[ https://lovable.dev/projects/4a9099f7-5e93-4e65-b144-95b8dd980280](https://github.com/Smilo-dev2022/kasi-connect-super-app/edit/main/README.md)

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

