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

## 2026-02-09 — Weekly Security Audit
- Vercel/Jarvis-board: found **auth bypass risk** in `/api/agent_loop/poll` (spoofable `x-vercel-cron: 1`).
- GitHub:
  - Jarvis-board: `main` **not protected**; Dependabot security updates **disabled**; secret scanning + push protection **enabled**.
  - Novl-API: no CI/workflows; branch protection appears unavailable on current plan; many collaborators have push (incl. one admin).
- Dependencies:
  - jarvis-board: `npm audit` clean.
  - novl-api: `npm audit` shows **11** vulns via `vercel` dependency chain.
- Clawdbot: gateway bound to loopback + token auth (good).

Report: `data/security-audit-2026-02-09.md`

## 2026-02-10 09:00 ET
- Sprint plan: secure `/api/agent_loop/poll` (remove `x-vercel-cron` trust), add regression test + verification script, and verify in prod after deploy.
