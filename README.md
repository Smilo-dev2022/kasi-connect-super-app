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
