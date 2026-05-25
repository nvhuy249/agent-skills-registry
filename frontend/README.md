# Agent Skills Registry Frontend

React frontend for Agent Skills Registry. It provides the browser interface for account auth, personal skill management, public skill discovery, Markdown editing, tagging, cloning, downloads, and version browsing.

## Stack

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS utilities
- Lucide React icons

## Local Development

From the repository root, install all dependencies and run both services:

Prerequisite: Node.js 20.19+ or 22.12+.

```sh
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

Frontend only:

```sh
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and uses `VITE_API_BASE_URL` for the backend origin. If the variable is not set, it falls back to `http://localhost:3000`.

## Structure

```text
frontend/src/
|-- api/             # Fetch wrappers for auth and skill routes
|-- components/      # Reusable UI components
|-- pages/           # Route-level screens
|-- App.tsx          # App shell
|-- AppAuth.tsx      # Auth state wrapper
|-- main.tsx         # React entry point
`-- router.tsx       # Route definitions
```

## Main Screens

- Login/signup landing flow.
- My Skills dashboard for private and owned skills.
- Public Skills directory for browsing shared skills.
- Skill viewer for public and owned skill details.
- Skill editor with Markdown/frontmatter editing.
- Version history view for pushed skill snapshots.

## Build

```sh
npm run build
```

## Notes

This frontend is designed for local/demo use. For deployment, the API base URL should be made configurable rather than assuming the local backend port.
