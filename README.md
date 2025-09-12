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

# Welcome to the Kasi chat Project

## Project info

**URL**: 

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

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

When the key is not set, the search will fall back to DuckDuckGo links. Image searches without SerpAPI show an external link to DDG Images.
