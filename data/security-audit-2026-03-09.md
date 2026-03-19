# Weekly Security Audit — 2026-03-09

## Executive summary
- Overall risk: **MEDIUM → HIGH**
  - Primary drivers: **Novl-API production dependency vulnerabilities** (npm audit: **16 total; 9 high**) + **no CI** + **branch protection unavailable** (current GitHub plan limitation) + **broad push surface**.
  - Secondary: **Jarvis-board `main` still unprotected** (public repo) + **Dependabot security updates disabled**.
  - Vercel posture remains **UNKNOWN** (no authenticated access/tooling from this run).

---

## 1) Findings

### Vercel
- **Not audited** in this run (no Vercel CLI / no authenticated access):
  - env vars/secrets hygiene
  - unexpected deployments
  - access/team roles
  - storage/integrations

### GitHub
**OrazioP26/Jarvis-board (public)**
- `main` branch protection: **NOT enabled** (API: 404 Branch not protected).
- Security & analysis:
  - Dependabot security updates: **disabled**
  - Secret scanning: **enabled**
  - Secret scanning push protection: **enabled**
- Secret scanning alerts (open): **0**.
- CI status:
  - Actions present (CI + CodeQL).
  - Most recent run on `main`: **success**.
  - Recent Dependabot PR run observed failing (**CI** on `dependabot/.../eslint-10.0.2`).

**Novl-Org/Novl-API (private)**
- Branch protection: **unavailable / not enabled** (API: 403 “Upgrade to GitHub Pro or make this repository public…”).
- Secret scanning: **disabled** (API: 404 “Secret scanning is disabled on this repository.”).
- Collaborators (push surface): **8 accounts**
  - Admins: **anthonytast**, **OrazioP26**
  - Push: 8ddieHu0314, Markus112105, claudiawong522, kathyart, mohdLabadi, robbieShekhtman
- CI / status checks: **none detected** (no `.github/workflows`).

### Dependencies
**jarvis-board**
- `npm audit --omit=dev`: **0 vulnerabilities** ✅
- `npm audit` (incl dev): **1 high** (`minimatch` via eslint/next toolchain)
  - Impact is likely dev-only, but still trips scanners/CI and should be cleared.

**novl-api**
- `npm audit --omit=dev`: **16 vulnerabilities** (**7 moderate, 9 high**) — primarily via `vercel` dependency chain:
  - notable: `tar` (high), `path-to-regexp` (high), `minimatch` (high), plus `ajv`/`esbuild`/`undici` (moderate).
  - remediation path: `npm audit fix --force` → installs `vercel@28.18.5` (**breaking**).
- Python: `pip-audit -r requirements.txt`: **1 known vulnerability**
  - `ecdsa` — **CVE-2024-23342** (timing side-channel on P-256)

### Repo / code hygiene
**novl-api**
- Hardcoded JWT secret present:
  - `routers/users.py`: `SECRET_KEY = "my-secret-key"` used for JWT encode/decode.
  - If this router is reachable in any deployed environment, treat as **high-risk**.

### Clawdbot / OpenClaw
- Gateway bind/auth: **loopback-only** bind (127.0.0.1) + **auth token enabled** ✅
- `openclaw status` security audit warnings:
  - Reverse proxy headers not trusted (OK if dashboard stays local-only)
  - Some configured models below recommended tier for tool-use (image model set to `openai/gpt-4o-mini`)
- Gateway doctor note (config hygiene): Telegram/iMessage group allowlist is empty → **all group messages dropped** (reduces exposure, but may surprise operationally).

---

## 2) Risk level
- **HIGH**: Novl-API — prod dependency vulns + no CI + broad collaborator push surface + secret scanning disabled + branch protection unavailable.
- **MEDIUM**: Jarvis-board — public repo with unprotected `main` and Dependabot security updates disabled.
- **LOW**: Clawdbot gateway exposure — loopback-only + token auth.
- **UNKNOWN**: Vercel posture.

---

## 3) Recommended actions

### Highest priority (this week)
1) **Novl-API: remove/move `vercel` out of production dependencies** (preferred) OR plan a controlled upgrade
   - Target: make `npm audit --omit=dev` clean (or materially reduced + explicitly documented).
2) **Novl-API: remove/replace hardcoded JWT secret** in `routers/users.py`
   - Replace with env-based secret (e.g. `NOVL_JWT_SECRET`) or delete/disable the legacy router.
3) **Novl-API: add minimal CI** (pytest + lint + npm audit check)
   - Even without branch protection, CI restores visibility and reduces regressions.
4) **Novl-API: enable GitHub secret scanning** (and Dependabot alerts/updates where available)
   - If plan limitations block it, document and compensate with local pre-commit + CI secret scan (e.g., gitleaks).

### Next priority
5) **Jarvis-board: enable branch protection on `main`** (PR required + require CI/CodeQL).
6) **Jarvis-board: enable Dependabot security updates**.
7) **Jarvis-board: bump dev tooling** to clear `minimatch` advisory and get Dependabot PR CI green.

### When Vercel access is available
8) Audit Vercel projects:
   - rotate/validate secrets, confirm deployments, confirm team access, confirm integrations.

---

## Evidence / commands (high-level)
- `gh api repos/OrazioP26/Jarvis-board/branches/main/protection`
- `gh api repos/OrazioP26/Jarvis-board --jq '.security_and_analysis'`
- `gh api 'repos/OrazioP26/Jarvis-board/secret-scanning/alerts?state=open&per_page=100'`
- `gh run list -R OrazioP26/Jarvis-board -L 5`
- `gh api repos/Novl-Org/Novl-API/branches/main/protection`
- `gh api 'repos/Novl-Org/Novl-API/collaborators?per_page=100'`
- `npm audit --omit=dev` / `npm audit`
- `./.auditvenv/bin/pip-audit -r requirements.txt`
- `rg -n 'SECRET_KEY = "my-secret-key"' routers/users.py`
- `openclaw status`
- `openclaw gateway status`
