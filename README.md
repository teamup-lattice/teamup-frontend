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

https://teamup-lattice-project.netlify.app

Every merge to `main` deploys to staging automatically, with no manual steps.

**How it works**
1. A pull request triggers the `CI` workflow (`npm ci`, lint, build). The `build` check must pass before merging.
2. After merge, Netlify builds the site (`npm run build`, output in `dist`) and publishes it.
3. If the Netlify build fails, the previous version stays live.

**Rolling back**
In Netlify, open Deploys, pick an older successful deploy and choose "Publish deploy". Then revert the bad commit on `main`.

**Environment variables**
`VITE_API_URL` (backend URL) is set in Netlify under Project configuration → Environment variables. Changing it needs a redeploy, because Vite bakes it in at build time. Never put secrets in `VITE_` variables.

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
