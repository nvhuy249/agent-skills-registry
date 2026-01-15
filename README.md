# Agent Skills Registry

Prototype web app for uploading, managing, and sharing agent skill markdown files. Skills are parsed for frontmatter metadata, stored in SQLite, and exposed via a React SPA backed by an Express/TypeScript API.

## What's implemented vs brief
- Accounts: signup/login with bcrypt-hashed passwords; auth via HttpOnly SameSite=Lax JWT cookie (username/userId still cached locally for UI).
- Skill CRUD: upload markdown (name/description pulled from frontmatter), edit, delete; private by default with public toggle; view my skills and public directory.
- Tagging: add/remove tags to skills; search/filter by name and tag; quick tag chips on both My Skills and Public Skills.
- Sharing: public skills list/search, download as markdown, clone to your library (with source attribution).
- Versioning: push versions with messages, list history, and view snapshots (no diff UI).
- Nice-to-have covered: download counts, version history, cloning. Nice-to-have not covered: GitHub-style diff view.

## Stack
- Frontend: React + TypeScript (Vite), Tailwind utility classes, React Router.
- Backend: Express + TypeScript, better-sqlite3, gray-matter for frontmatter parsing.
- Data: SQLite at `backend/db/database.sqlite` (created on first run).

## Running locally
Prereqs: Node 18+ and npm.

1) Set JWT secret (PowerShell, from repo root)
```pwsh
$secret = [Guid]::NewGuid().ToString() + [Guid]::NewGuid().ToString()
"JWT_SECRET=$secret" | Set-Content -Encoding UTF8 backend/.env
```
   - Or edit `backend/.env` manually using the template in `backend/.env.example`.

2) Install deps
```sh
npm install                # root (installs npm-run-all)
npm install --prefix backend
npm install --prefix frontend
```
3) Start dev servers (root)
```sh
npm run dev
```
   - Backend: http://localhost:3000  
   - Frontend: http://localhost:5173

To reset data, stop servers and delete `backend/db/database.sqlite`.

## Usage notes
- Sign up or log in from the landing page; credentials are local to this app.
- Upload `.md` with frontmatter `name` (required) and `description`/`allowed_tools` (optional).
- Manage privacy, add tags, edit content, and push versions from My Skills. Public Skills lets you search, view, download, and clone.
- When cloning, tags are copied and the source user is recorded.

## Project layout
- `backend/` - Express API, SQLite schema/migrations-in-code, routes for auth/skills.
- `frontend/` - React SPA pages/components and API client.
- `package.json` (root) - combined dev runner (`npm run dev`).

## Limitations / future work
- No GitHub-style diff UI between versions (explicitly omitted for time).
- Authentication now uses HttpOnly SameSite=Lax JWT cookies, but still minimal (dev secret fallback, no rate limiting or rigorous validation). Next: set a real `JWT_SECRET`, add validation and light throttling, and tighten error handling.
- No Docker packaging. With more time: add backend `Dockerfile` (Node build + `node dist/server.js`), frontend `Dockerfile` (build then serve `dist` via nginx/caddy), and a root `docker-compose.yml` wiring ports and a volume for `backend/db/database.sqlite`; update frontend to read `VITE_API_BASE` for container networking.
- Filtering/sorting/search: currently client-side (name/tag). Move queries to the backend with pagination to better handle larger datasets; expose query params for name, tag, sort, page/size. Apply same treatment for My Skills tag search.
- Versioning UX: "Save" updates the current skill; "Push version" acts as a checkpoint and records history. Consider auto-creating a version on every save or prompting for a message to avoid silent edits.
- "Revert to this version" is not built; can reuse `showversion` + `pushversion` to write the snapshot back as a new version and update the skill.
