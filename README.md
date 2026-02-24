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

Generated documents (created by Jarvis/Claude Code) are stored at:

- `data/documents/` (default)

You can override the directory with:

- `JARVIS_BOARD_DOCS_DIR=./some/other/folder`

## Drive uploads (PDF)

If you want jarvis-board to generate a PDF and upload it to Google Drive, enable the local `gog` integration:

- `JARVIS_BOARD_ENABLE_GOG_DRIVE=1`

Optional:
- `JARVIS_DRIVE_FOLDER_ID=<folderId>` (otherwise jarvis-board will create a folder named **Jarvis Documents**)

Notes:
- This is intended for **local/self-hosted** use (the server needs access to your local `gog` auth).

## Local dev

```bash
cd jarvis-board
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

- `GET /api/documents` (list stored docs)
- `POST /api/documents` (create a doc: {title, content, ext})
- `POST /api/documents/read` (read a doc by relative path: {path})
- `POST /api/documents/pdf-drive` (generate PDF + upload to Drive: {title, content})

## Notes / next steps

- Add task tags, due dates, and quick filters
- Add a separate Deliverables “folders” concept (or project-based grouping)
- Switch persistence from lowdb → SQLite (Drizzle) if/when wanted
