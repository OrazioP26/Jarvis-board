# Weekly Security Audit — 2026-02-16

## Executive summary
- Overall risk: **MEDIUM → HIGH** (mainly due to **unprotected branches** + **vulnerable deps in `novl-api`** + limited visibility into Vercel).

---

## 1) Findings

### GitHub
**OrazioP26/Jarvis-board (public)**
- `main` branch protection: **NOT enabled** (GitHub API: “Branch not protected”).
- Workflows/CI: **present** (recent CodeQL + CI runs; most recent run success, one recent Dependabot PR CI failure).
- Collaborators: **only OrazioP26**.
- Secret scanning: not verified in this run (UI toggle).

**Novl-Org/Novl-API (private)**
- Branch protection: **appears unavailable / not enabled** (GitHub API 403: “Upgrade to GitHub Pro or make this repository public to enable this feature.”)
- Workflows/CI: **none detected** (Actions total_count: 0).
- Collaborators: **multiple with access** (sample: 8ddieHu0314, Markus112105, OrazioP26, anthonytast, claudiawong522, kathyart, mohdLabadi, robbieShekhtman).

### Dependencies
**jarvis-board**
- `npm audit`: **0 vulnerabilities**.

**novl-api**
- `npm audit` (prod deps): **11 vulnerabilities** (3 moderate, 8 high), primarily via `vercel` dependency chain.
  - Highlights:
    - `path-to-regexp` (high) — backtracking regex risk.
    - `tar` (high) — arbitrary file overwrite / traversal class issues.
    - `undici` (moderate) — redirect header handling + other issues.
    - `esbuild` (moderate) — dev server request/response exposure.
  - Fix path suggested by npm: `npm audit fix --force` → installs `vercel@28.18.5` (breaking change).

**Python deps (novl-api)**
- `pip-audit` scan: **not completed** during this run (would require running inside a dedicated venv/pipx with network access).

### Vercel
- Not audited (no authenticated access available in this run):
  - Env vars/secrets hygiene
  - Unexpected deployments
  - Access control
  - Storage integrations

### Clawdbot
- Gateway status: **running**
- Bind: **loopback-only (127.0.0.1:18789)** ✅
- Exposed services: **not publicly reachable** via gateway bind ✅
- Plugin/API key handling: not re-validated in config in this run (would require config review; avoid leaking secrets).

---

## 2) Risk level
- **HIGH**: `novl-api` npm vulnerabilities (high severity) + no CI + limited branch protection.
- **MEDIUM**: Jarvis-board `main` still unprotected (public repo).
- **LOW**: Clawdbot gateway exposure (loopback-only).
- **UNKNOWN**: Vercel (no audit visibility today).

---

## 3) Recommended actions
### Immediate (today/this week)
1) **Novl-API: resolve npm audit**
   - Run `npm audit fix` → recheck.
   - If needed: upgrade `vercel` intentionally (may require breaking changes) and confirm deploy.
2) **Novl-API: add CI** (tests/lint) so merges can be gated.
3) **Novl-API: review collaborators** and reduce push access (least privilege).
4) **Jarvis-board: enable branch protection on `main`** (PR-required + status checks).

### Next (when Vercel access is available)
5) Vercel project audit:
   - confirm no secrets stored in plaintext env vars unnecessarily
   - confirm deployment history matches expected
   - confirm team/member access + integrations (Supabase/storage) are least-privileged

---

## Evidence / commands (high-level)
- `gh repo view ... --json defaultBranchRef,visibility`
- `gh api .../branches/main/protection`
- `gh api .../collaborators`
- `gh run list --repo ...`
- `npm audit` (jarvis-board, novl-api)
- `clawdbot gateway status`
