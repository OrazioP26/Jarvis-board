# Activity Log

## 2026-02-02 — Weekly Security Audit
- GitHub:
  - Jarvis-board: main branch not protected.
  - Novl-desktop: branch protection unavailable on current plan; collaborators w/ push: anthonytast, Markus112105.
- Dependencies:
  - novl-dashboard: 5 moderate npm audit findings (vite/vitest/esbuild chain); recommends vitest major upgrade.
- Clawdbot:
  - Gateway bound to loopback + token auth enabled (good).
  - Config holds plaintext tokens locally; no evidence of token leakage in workspace.
- Vercel: not audited (no authenticated access).

## 2026-02-02 09:05 ET
- Sprint plan: focus on Jarvis-board repo hardening (CI + branch protection + scanning). Updated db.json: moved *Protect Jarvis-board main branch* + *Enable security scanning* to In Progress; added tasks for CI workflow and Dependabot.
