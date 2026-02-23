# Weekly Security Audit — 2026-02-23

## Executive summary
- Overall risk: **MEDIUM → HIGH**
  - Primary drivers: **Novl-API dependency vulnerabilities (npm audit: 22 total; 19 high)** + **no CI** + **branch protection unavailable on current plan**.
  - Secondary: **Jarvis-board `main` still unprotected** (public repo).
  - Vercel remains **UNKNOWN** (no authenticated access from this run).

---

## 1) Findings

### GitHub
**OrazioP26/Jarvis-board (public)**
- `main` branch protection: **NOT enabled** (GitHub API returns 404 “Branch not protected”).
- Actions/CI: **present and healthy** (recent scheduled CodeQL run succeeded).
- Collaborators: **OrazioP26 only**.

**Novl-Org/Novl-API (private)**
- Branch protection: **unavailable / not enabled** (GitHub API 403: “Upgrade to GitHub Pro or make this repository public to enable this feature.”).
- Actions/CI: **none detected** (`actions/workflows.total_count = 0`).
- Collaborators (push surface): **8 accounts** — 8ddieHu0314, Markus112105, OrazioP26, anthonytast, claudiawong522, kathyart, mohdLabadi, robbieShekhtman.

### Dependencies
**jarvis-board**
- `npm audit --omit=dev`: **0 vulnerabilities** ✅

**novl-api**
- `npm audit` (prod deps): **22 vulnerabilities** (**3 moderate, 19 high**) via the `vercel` dependency chain.
  - Same “shape” as prior week, but **worse count**.
  - Notable advisories in chain: `minimatch` (high), `path-to-regexp` (high), `tar` (high), plus moderate issues in `ajv`, `esbuild`, `undici`.
  - npm’s suggested remediation: `npm audit fix --force` → installs `vercel@28.18.5` (breaking change).

### Vercel
- Not audited in this run (no authenticated access available):
  - env vars/secrets hygiene
  - unexpected deployments
  - access/team roles
  - storage integrations

### Clawdbot
- Gateway bind/auth: **loopback-only** bind + **token auth enabled** ✅
- Config file permissions: `/Users/oraziopetito/.clawdbot/clawdbot.json` is `0600` ✅
- Key handling note: secrets live in a local plaintext JSON config (expected), so risk is primarily **device compromise / accidental inclusion in backups/repos**.

---

## 2) Risk level
- **HIGH**: Novl-API — dependency vulns (19 high) + no CI + broad collaborator set.
- **MEDIUM**: Jarvis-board — public repo with unprotected `main`.
- **LOW**: Clawdbot gateway exposure — loopback-only + token.
- **UNKNOWN**: Vercel posture.

---

## 3) Recommended actions
### This week (highest ROI)
1) **Novl-API: reduce/remove the `vercel` runtime dependency chain**
   - Prefer: uninstall `vercel` or move it to `devDependencies` (if not needed at runtime), then re-run `npm audit --omit=dev`.
   - If `vercel` is required: plan an intentional upgrade path (breaking bump) + deploy verification.
2) **Novl-API: add minimal CI** (lint/test + dependency scan) so merges are gated.
3) **Novl-API: collaborator review** (least privilege).
4) **Jarvis-board: enable branch protection on `main`** (PR required + status checks).

### When Vercel access is available
5) Audit Vercel projects:
   - rotate/validate secrets, confirm deployments, confirm team access, confirm integrations.

---

## Evidence / commands (high-level)
- `gh api repos/OrazioP26/Jarvis-board/branches/main/protection`
- `gh run list --repo OrazioP26/Jarvis-board`
- `gh api repos/Novl-Org/Novl-API/actions/workflows`
- `gh api repos/Novl-Org/Novl-API/branches/main/protection`
- `npm audit --omit=dev` (jarvis-board)
- `npm audit --omit=dev` (novl-api)
- `gateway config.get` + local file permission check
