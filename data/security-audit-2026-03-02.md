# Weekly Security Audit — 2026-03-02

## Executive summary
- Overall risk: **MEDIUM → HIGH**
  - Primary drivers: **Novl-API production dependency vulns (npm audit: 16 total; 9 high)** + **no CI** + **branch protection unavailable on current plan** + broad push surface.
  - Secondary: **Jarvis-board `main` still unprotected** (public repo) and **Dependabot security updates disabled**.
  - Vercel posture remains **UNKNOWN** (no authenticated access from this run).

---

## 1) Findings

### GitHub
**OrazioP26/Jarvis-board (public)**
- `main` branch protection: **NOT enabled** (GitHub API returns 404 “Branch not protected”).
- Security & analysis:
  - Dependabot security updates: **disabled**
  - Secret scanning: **enabled**
  - Secret scanning push protection: **enabled**
- Collaborators: **OrazioP26 only**.

**Novl-Org/Novl-API (private)**
- Branch protection: **unavailable / not enabled** (GitHub API 403: “Upgrade to GitHub Pro or make this repository public to enable this feature.”).
- Collaborators (push surface): **8 accounts**
  - Admins: **anthonytast**, **OrazioP26**
  - Push: 8ddieHu0314, Markus112105, claudiawong522, kathyart, mohdLabadi, robbieShekhtman
- CI / status checks: **none detected** (still).

### Dependencies
**jarvis-board**
- `npm audit --omit=dev`: **0 vulnerabilities** ✅
- `npm audit` (incl dev): **1 high** (`minimatch` via eslint/next toolchain)
  - Likely impacts: dev tooling only, but still worth bumping to keep CI/scanners quiet.

**novl-api**
- `npm audit --omit=dev`: **16 vulnerabilities** (**7 moderate, 9 high**) — primarily via `vercel` dependency chain:
  - notable: `tar` (high), `path-to-regexp` (high), `minimatch` (high), plus `esbuild`/`ajv`/`undici` (moderate).
  - npm remediation path: `npm audit fix --force` → bumps `vercel@28.18.5` (**breaking**).
- Python (`pip-audit -r requirements.txt`): **1 known vulnerability**
  - `ecdsa` — **CVE-2024-23342** (timing side-channel on P-256)
  - No upstream fix planned; mitigation is to avoid ECDSA signing operations in sensitive contexts (or switch implementation).

### Repo / code hygiene
**novl-api**
- Hardcoded JWT secret found:
  - `routers/users.py`: `SECRET_KEY = "my-secret-key"` used for JWT encode/decode.
  - This is a real footgun if that legacy router is reachable in any deployed environment.

### Vercel
- Not audited in this run (no authenticated access available):
  - env vars/secrets hygiene
  - unexpected deployments
  - access/team roles
  - storage/integrations

### Clawdbot
- Gateway bind/auth: **loopback-only** bind + **token auth enabled** ✅
- `clawdbot status` security audit warnings:
  - Reverse proxy headers not trusted (OK as long as gateway stays local-only)
  - Image model below recommended tier for tool-use (currently `gpt-4o-mini` for vision)
- LaunchAgents: `com.jarvis.listener` running `scripts/jarvis_listener.py` (local mic listener). No obvious remote exposure from the file itself, but it is a persistent process.

---

## 2) Risk level
- **HIGH**: Novl-API — prod dependency vulns + no CI + broad collaborator push surface + branch protection unavailable.
- **MEDIUM**: Jarvis-board — public repo with unprotected `main` and Dependabot security updates disabled.
- **LOW**: Clawdbot gateway exposure — loopback-only + token auth.
- **UNKNOWN**: Vercel posture.

---

## 3) Recommended actions
### Do this week (highest ROI)
1) **Novl-API: remove `vercel` from production dependencies** (preferred) or plan an intentional upgrade
   - Goal: make `npm audit --omit=dev` clean (or reduced + explicitly documented).
2) **Novl-API: kill/patch legacy `routers/users.py` hardcoded secret**
   - Replace with env-based `NOVL_JWT_SECRET` (or delete the router if superseded).
3) **Novl-API: add minimal CI** (tests + lint + audit check)
   - Even without branch protection, CI gives visibility + reduces regressions.
4) **Jarvis-board: enable branch protection on `main`**
   - PR required + require CI/CodeQL checks.
5) **Jarvis-board: enable Dependabot security updates**
6) **Jarvis-board: bump dev tooling to clear `minimatch` advisory**

### When Vercel access is available
7) Audit Vercel projects:
   - rotate/validate secrets, confirm deployments, confirm team access, confirm integrations.

---

## Evidence / commands (high-level)
- `gh api repos/OrazioP26/Jarvis-board/branches/main/protection`
- `gh api repos/OrazioP26/Jarvis-board --jq '.security_and_analysis'`
- `gh api repos/Novl-Org/Novl-API/branches/main/protection`
- `gh api "repos/Novl-Org/Novl-API/collaborators?per_page=100"`
- `npm audit --omit=dev` (jarvis-board)
- `npm audit` (jarvis-board)
- `npm audit --omit=dev` (novl-api)
- `.auditvenv/bin/pip-audit -r requirements.txt`
- `clawdbot status`
