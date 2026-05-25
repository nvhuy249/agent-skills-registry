# Agent Skills Registry

Agent Skills Registry is a full-stack web app for storing, versioning, and sharing reusable AI agent skill files. Users can upload Markdown-based skills with frontmatter metadata, keep private drafts, publish selected skills to a public directory, and clone shared skills into their own library.

The project is built as a practical registry for structured agent capabilities, with a React single-page app, an Express API, cookie-based authentication, and SQLite persistence.

I intentionally kept the stack close to the underlying pieces instead of using a full-stack meta-framework. The frontend, backend API, authentication, CORS, cookies, database schema, and client-side API calls are wired explicitly so the connections between the browser, server, and persistence layer are visible in the code.

## Why I Built This

AI agent workflows increasingly depend on reusable instructions, tool permissions, and repeatable operating patterns. This app explores what a lightweight skill registry could look like: part personal library, part public directory, and part versioned content manager.

For my portfolio, this project demonstrates my ability to ship a working full-stack TypeScript application with authentication, relational data modelling, file parsing, CRUD workflows, version history, and a polished frontend user experience.

It also reflects a deliberate learning goal: building the system with lightweight framework layers rather than relying on a highly abstracted application framework, so I could show practical understanding of how the tech stack fits together end to end.

## Features

- User accounts with signup and login.
- Password hashing with bcrypt.
- JWT authentication stored in an HttpOnly SameSite cookie.
- Upload Markdown skill files with parsed frontmatter metadata.
- Store skill name, description, content, allowed tools, tags, privacy, ownership, and download counts.
- Private personal skill library.
- Public skill directory with browsing, searching, and tag filtering.
- Edit existing skills and update parsed metadata.
- Publish or unpublish skills.
- Add and remove tags.
- Download public skills as Markdown.
- Clone public skills into a user's own library with source attribution.
- Push named versions and browse version history.
- View previous version snapshots.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS utilities
- Lucide React icons

### Backend

- Node.js
- Express
- TypeScript
- SQLite via `better-sqlite3`
- `gray-matter` for Markdown frontmatter parsing
- `bcrypt` for password hashing
- `jsonwebtoken` with cookie-based auth

## Architecture

```text
agent-skills-registry/
|-- backend/
|   |-- src/
|   |   |-- middleware/      # Auth middleware
|   |   |-- routes/          # Auth and skill API routes
|   |   |-- db.ts            # SQLite connection
|   |   |-- schema.ts        # Table setup
|   |   `-- server.ts        # Express server
|   `-- db/                  # Local SQLite database
|-- frontend/
|   `-- src/
|       |-- api/             # API client helpers
|       |-- components/      # Shared UI components
|       |-- pages/           # Route-level views
|       `-- router.tsx       # Client routes
`-- package.json             # Combined dev runner
```

The backend exposes a JSON API and persists data in SQLite. The frontend consumes that API from a Vite React app. Authentication is handled server-side through signed JWT cookies, while the frontend keeps only lightweight UI state.

## Data Model

The SQLite schema includes:

- `users` for accounts and password hashes.
- `skills` for current skill records.
- `tags` for reusable tag names.
- `skill_tags` as the many-to-many relationship between skills and tags.
- `skill_versions` for version snapshots with messages.

This gives the app enough structure to support ownership, public/private visibility, search by tags, version history, cloning, and download analytics.

## Running Locally

Prerequisites:

- Node.js 20.19+ or 22.12+
- npm

Create a backend environment file:

```pwsh
$secret = [Guid]::NewGuid().ToString() + [Guid]::NewGuid().ToString()
@"
JWT_SECRET=$secret
CLIENT_ORIGIN=http://localhost:5173
"@ | Set-Content -Encoding UTF8 backend/.env
```

Alternatively, copy `backend/.env.example` to `backend/.env` and set your own `JWT_SECRET`.

Optional frontend environment:

```sh
VITE_API_BASE_URL=http://localhost:3000
```

The frontend falls back to `http://localhost:3000` when `VITE_API_BASE_URL` is not set.

Install dependencies:

```sh
npm install
npm install --prefix backend
npm install --prefix frontend
```

Start both development servers:

```sh
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

To reset local data, stop the servers and delete `backend/db/database.sqlite`. The schema is recreated automatically on the next backend start.

## Testing

Run the backend smoke test and frontend production build from the repository root:

```sh
npm test
```

The backend smoke test starts the compiled API on a random local port with an isolated temporary SQLite database. It covers signup, auth-required routes, skill upload, public/private visibility, tags, downloading, version history, and cloning.

## Example Skill Format

Skills are uploaded as Markdown files with YAML frontmatter:

```md
---
name: Code Review Assistant
description: Reviews pull requests for correctness, maintainability, and test coverage.
allowed_tools:
  - github
  - shell
---

Review the code changes carefully. Prioritize correctness, security, regression risk, and missing tests.
```

The app parses the frontmatter into structured fields while storing the Markdown body as the skill content.

## API Overview

Main backend routes include:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/skills/loadskills`
- `POST /api/skills/uploadskill`
- `POST /api/skills/editskill`
- `DELETE /api/skills/deleteskill`
- `POST /api/skills/changeprivacy`
- `GET /api/skills/publicskills`
- `GET /api/skills/showpublicskill`
- `GET /api/skills/downloadskill`
- `POST /api/skills/clonepublicskill`
- `POST /api/skills/addtag`
- `POST /api/skills/removetag`
- `GET /api/skills/loadversions`
- `POST /api/skills/pushversion`
- `GET /api/skills/showversion`

## What This Demonstrates

- Full-stack TypeScript development across React and Express.
- Understanding of the boundaries between frontend state, HTTP API design, auth cookies, CORS, server routes, and database persistence.
- Deliberate use of lightweight framework layers rather than a full-stack meta-framework, keeping the application flow easy to inspect.
- Practical authentication with hashed passwords and HttpOnly cookies.
- Relational schema design for users, resources, tags, and version history.
- Markdown and YAML frontmatter parsing.
- Ownership and authorization checks for private data.
- Public/private publishing workflows.
- Reusable API client structure on the frontend.
- React routing and protected routes.
- Stateful UI for editing, filtering, cloning, downloading, and version browsing.
- Local-first development with SQLite.
- Smoke testing of core backend workflows with Node's built-in test runner.

## Current Limitations

- Search and filtering are mostly client-side and should move to backend query parameters with pagination for larger datasets.
- Version history supports snapshots, but not visual diffs.
- There is no revert workflow yet, although the existing version snapshot endpoint provides most of the data needed.
- Authentication is suitable for local/demo use, but production hardening would need rate limiting, stronger validation, secure deployment configuration, and more defensive error handling.
- Production deployments must set `JWT_SECRET`, `CLIENT_ORIGIN`, and `VITE_API_BASE_URL` for the deployed domains.
- The app is not containerized yet.

## Future Improvements

- Add GitHub-style diffs between skill versions.
- Add "revert to version" as a first-class action.
- Add backend pagination, sorting, and search.
- Expand automated tests across edge cases, validation, and frontend behavior.
- Add Docker support for local and deployed environments.
- Add richer skill analytics such as clone counts and recent activity.
- Add profile pages for public skill authors.

## Repository Notes

This repository is intended to be easy to run locally and inspect as a portfolio project. It is not deployed as a hosted production service.

Before publishing a fork or copy publicly, avoid committing local runtime data such as `backend/.env` or `backend/db/database.sqlite`.
