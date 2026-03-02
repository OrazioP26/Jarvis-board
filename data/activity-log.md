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

## 2026-02-16 — Weekly Security Audit
- GitHub:
  - Jarvis-board: `main` branch **not protected** (still).
  - Novl-API: branch protection **not enabled / unavailable** (API returns 403 for private repo protection on current plan); **no Actions/CI** detected.
  - Novl-API: collaborators list is broad; needs least-privilege review.
- Dependencies:
  - jarvis-board: `npm audit` clean.
  - novl-api: `npm audit` shows **11** vulns (3 moderate, 8 high) via `vercel` chain (esbuild/path-to-regexp/undici/tar).
- Clawdbot:
  - Gateway bound to **127.0.0.1** (loopback-only) + probe ok (good).
- Vercel: not audited (no authenticated access).

Report: `data/security-audit-2026-02-16.md`

## 2026-02-23 — Weekly Security Audit
- GitHub:
  - Jarvis-board: `main` branch **not protected** (still).
  - Novl-API: branch protection **unavailable** on current plan; **no Actions/CI** detected; collaborator set remains broad.
- Dependencies:
  - jarvis-board: `npm audit` clean.
  - novl-api: `npm audit` now shows **22** vulns (**19 high**) via `vercel` chain.
- Clawdbot:
  - Gateway bound to loopback + token auth (good); config file permissions `0600`.
- Vercel: not audited (no authenticated access).

Report: `data/security-audit-2026-02-23.md`

## 2026-03-02 — Weekly Security Audit
- GitHub:
  - Jarvis-board: `main` branch **not protected**; Dependabot security updates **disabled**; secret scanning + push protection **enabled**.
  - Novl-API: branch protection **unavailable** on current plan; **no Actions/CI** detected; collaborator push surface remains broad (8 accounts).
- Dependencies:
  - jarvis-board: `npm audit --omit=dev` clean; `npm audit` shows **1 high** (dev toolchain: `minimatch`).
  - novl-api: `npm audit --omit=dev` shows **16** vulns (**9 high**) via `vercel` chain.
  - novl-api (python): `pip-audit` flags **ecdsa CVE-2024-23342** (no fix planned).
- Repo hygiene:
  - novl-api: found hardcoded JWT secret `SECRET_KEY = "my-secret-key"` in `routers/users.py`.
- Clawdbot:
  - Gateway bound to loopback + token auth (good). Security audit warns about trusted proxies (fine if local-only) and image model tier.
- Vercel: not audited (no authenticated access).

Report: `data/security-audit-2026-03-02.md`
