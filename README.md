# Jarvis-board

Lightweight **local-only** task dashboard for Orazio + Jarvis.

## Features

- Kanban board with columns: **Todo / In Progress / Done / Archived**
- Drag-and-drop tasks between columns (dnd-kit)
- Create / edit / delete tasks
- Assign tasks to **Orazio** vs **Jarvis** (or Unassigned)
- "Deliverables" section: simple list of artifacts (name + link/path + notes)

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS
- `@dnd-kit/*` for drag-and-drop
- `lowdb` (JSON file) for persistence (no external DB)

Data is stored at:

- `data/db.json`

## Local dev

```bash
cd novl-dashboard
npm install
npm run dev
```

Open:

- http://localhost:3000

## API (internal)

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

- `GET /api/deliverables`
- `POST /api/deliverables`
- `PATCH /api/deliverables/:id`
- `DELETE /api/deliverables/:id`

## Notes / next steps

- Add task tags, due dates, and quick filters
- Add a separate Deliverables “folders” concept (or project-based grouping)
- Switch persistence from lowdb → SQLite (Drizzle) if/when wanted
