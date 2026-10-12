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
git clone https://github.com/Tumiii2/teamup-frontend.git
cd teamup-frontend
npm install
npm run dev
```

## Staging

https://teamup-lattice.netlify.app (auto-deploys from `main`)

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

Frontend: Eniola, Daniel
