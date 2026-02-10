# Weekly Security Audit — 2026-02-09 (Mon)

## Findings

### Vercel
- **Jarvis-board:** `vercel.json` schedules a cron hit to `/api/agent_loop/poll` every minute.
  - In `src/lib/agentLoop.ts`, requests with header `x-vercel-cron: 1` are treated as authorized **without** `JARVIS_BOARD_WEBHOOK_SECRET`.
  - Because the repo is public, an attacker can likely hit the endpoint and spoof `x-vercel-cron: 1`, potentially triggering automation/sub-agent spawning.
- **Novl-API:** `vercel.json` sets CORS allow-origin to `https://novl-add-on.vercel.app` (good), and allows credentials.

### GitHub
- **Jarvis-board (OrazioP26/Jarvis-board)**
  - `main` branch protection: **NOT enabled** (Branch not protected).
  - Secret scanning: **enabled**; push protection: **enabled**.
  - Dependabot security updates: **disabled**.
  - Collaborators: only `OrazioP26` (admin) (good).
  - Recent deployments (GitHub deployments): all by `vercel[bot]` (expected).
- **Novl-API (Novl-Org/Novl-API)**
  - No GitHub Actions workflows found (`.github/` missing) → no CI/CodeQL.
  - Branch protection endpoint returns **403** (“Upgrade to GitHub Pro or make this repository public…”), so `main` cannot be protected on current plan.
  - Collaborators with **push** access include multiple non-admins; `anthonytast` has **admin**.

### Dependencies
- **Jarvis-board:** `npm audit --omit=dev` → **0 vulnerabilities**.
- **Novl-API:** `npm audit --omit=dev` → **11 vulnerabilities** (8 high, 3 moderate), all through the `vercel` package dependency chain (`esbuild`, `path-to-regexp`, `tar`, `undici`, etc.).
  - `vercel` is currently in `dependencies` (not devDependencies), so it’s considered runtime.

### Clawdbot
- Gateway service running, **bound to loopback** (`127.0.0.1` / `::1`) on port **18789**, token auth enabled (good).
- `clawdbot status` warns:
  - Reverse proxy headers not trusted (only relevant if you expose the Control UI via reverse proxy).
  - Image model below recommended tier (operational note; not a direct vuln).

## Risk level
- **Overall: HIGH**
  - Primary driver: **Jarvis-board agent loop auth bypass** via spoofable `x-vercel-cron` header on a public repo/app.
  - Secondary: **Novl-API** has broad collaborator push access + no CI/branch protection.
  - Tertiary: `novl-api` npm dependency vulnerabilities via bundled `vercel` package.

## Recommended actions (priority order)

1) **Jarvis-board: lock down `/api/agent_loop/poll`**
   - Remove/disable the `x-vercel-cron` bypass OR replace it with a verifiable mechanism.
   - If cron automation is needed, prefer:
     - Running the poll from a trusted environment (local machine / private server) with `x-jarvis-secret`, OR
     - Making the app/repo private so the cron endpoint path/secret is not public.

2) **Jarvis-board: enable branch protection + Dependabot security updates**
   - Enable Dependabot security updates in Settings → Security & analysis.
   - Add branch protection for `main` (require PR, require CI + CodeQL checks, no force push).

3) **Novl-API: reduce access + add basic CI**
   - Reduce collaborator permissions (move most to triage/pull; keep minimal push).
   - Add at least a minimal CI workflow (lint/test) and (if feasible) CodeQL.
   - Decide on plan: upgrade GitHub plan or make the repo public if you want branch protection.

4) **Novl-API: fix npm audit findings**
   - Remove `vercel` from runtime deps (move to devDependencies or uninstall) and/or bump to latest, then rerun `npm audit`.

5) **Novl-API: remove hardcoded JWT secret**
   - `routers/users.py` contains `SECRET_KEY = "my-secret-key"` used for JWT encode/decode.
   - Replace with env-based secret (e.g., `NOVL_JWT_SECRET`) or remove this router if superseded by `app/core/security.py`.
