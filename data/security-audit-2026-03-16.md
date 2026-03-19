# Weekly Security Audit — 2026-03-16

## GitHub
**OrazioP26/Jarvis-board (public)**
- Branch protection: **NOT enabled** for `main` (branch protection endpoint returns 404).
- Security & analysis:
  - Dependabot security updates: **disabled**
  - Secret scanning: **enabled**
  - Secret scanning push protection: **enabled**
  - Open secret-scanning alerts: **0**
- Recent Actions: CodeQL scheduled run succeeded; a Dependabot PR CI run failed (eslint bump PR).

## Vercel
- Not audited via API/CLI: Vercel CLI has **no credentials** on this machine (needs `vercel login` or `--token`).
- Repo config observed:
  - `jarvis-board/vercel.json` defines a cron hitting `/api/agent_loop/poll` every minute.

## Dependencies
**jarvis-board**
- `npm audit --omit=dev`: **0 vulnerabilities**
- `npm audit`: **2 HIGH** (dev toolchain)
  - `minimatch` (ReDoS advisories)
  - `flatted` (<3.4.0 recursion DoS)

**novl-dashboard**
- `npm audit --omit=dev`: **0 vulnerabilities**

**novl-api**
- Python audit: **NOT run** (pip-audit not installed/available; PEP 668 blocks global pip install).

## Clawdbot/OpenClaw
- Gateway: `bind=loopback` + `auth.mode=token` (good).
- Tailscale: off.
- Telegram channel: group allowlist + sendMessage disabled (good guardrail).
- Secrets: stored in local OpenClaw config (expected); ensure file perms remain restrictive.

## App-level security (Jarvis-board)
- **HIGH**: `jarvis-board/src/lib/agentLoop.ts` still treats `x-vercel-cron: 1` as sufficient auth for `/api/agent_loop/poll` when `VERCEL` or `NODE_ENV=production`.
  - This is spoofable if the route is publicly reachable; Vercel cron requests can be mimicked.

## Recommended actions
1) Remove `x-vercel-cron` trust path; require shared secret (header or query) for poll endpoint.
2) Protect `main` branch + enable Dependabot security updates.
3) Clear npm audit highs in Jarvis-board dev toolchain (upgrade eslint/next chain as needed).
4) Add a Python dependency vuln scan (pip-audit) in CI for Novl-API.
5) Add Vercel read-only token/visibility for future audits.
