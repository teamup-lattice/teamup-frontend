# TeamUp Frontend

**TeamUp** is a project-collaboration platform that helps digital skill learners and early-career professionals turn what they've learned into real project experience. Users find collaborators, form committed teams, build a project together, and finish with a project page showing what each person actually contributed.

Built for the TechCrush Buildathon 3.0 by Team Lattice (Group 8).

## The problem

Many people learn digital skills but struggle to find collaborators, real projects and the structure to finish. Teams often go inactive and projects get abandoned.

## Core journey

1. Sign up and create a profile (skills, goals, availability)
2. Discover projects or collaborators
3. Join a team after accepting role, hours and deadlines
4. Work in a shared workspace (tasks, milestones, progress)
5. Complete the project and generate a shareable project page with each member's contribution

## Tech stack

- React (Vite)
- React Router
- ESLint

## Getting started

```bash
git clone https://github.com/teamup-lattice/teamup-frontend.git
cd teamup-frontend
npm install
npm run dev
```

## Staging

https://teamup-frontend-vert.vercel.app/

Every merge to `main` deploys to staging automatically, with no manual steps.

### How it works

1. A pull request triggers the `CI` workflow (`npm ci`, lint, build). The `build` check must pass before merging.
2. After merge, Vercel builds the site (`npm run build`, output in `dist`) and publishes it.
3. If the Vercel build fails, the previous version stays live.

**Rolling back** In Vercel, open Deployments, find an earlier successful production deployment and use Instant Rollback from its menu. Then revert the bad commit on `main`.

**Environment variables** `VITE_API_URL` (backend URL) is set in Vercel under Project Settings → Environment Variables. Changing it needs a redeploy, because Vite bakes it in at build time. Never put secrets in `VITE_` variables.

**Routing** `vercel.json` rewrites all routes to `index.html` so client-side routes work on refresh.

## Folder structure

- `src/pages/` has one file per screen
- `src/components/` has reusable UI pieces
- `src/layouts/` has shared page layouts
- `src/services/` has API calls to the backend
- `src/data/` has mock data until the backend is ready

## Routes

- `/signup`, `/login`, `/profile`
- `/projects` is project discovery
- `/projects/new` creates a project
- `/projects/:id` is a single project
- `/projects/:id/workspace` is the team workspace
- `/projects/:id/page` is the completed project page

## Team

Frontend: Eniola, Daniel, Adetomiwa
