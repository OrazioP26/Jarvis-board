# Weekly Security Audit — 2026-02-02 (Mon)

## Scope
- Vercel: env vars/secrets hygiene, deployments, access, storage integrations
- GitHub: branch protections, collaborators, tokens/keys exposure, CI status
- Dependencies: vulnerability scan (npm/pip), recent CVEs relevant to stack
- Clawdbot: exposed services, gateway bind/auth, plugin config, API key handling

## Findings (high-signal)
### Vercel
- Not audited this run: no authenticated Vercel access available from the agent (no `vercel` CLI installed; browser relay not attached).

### GitHub
- **OrazioP26/Jarvis-board (public)**
  - `main` **is not protected** (no branch protection rules).
  - Collaborators: **only OrazioP26 (admin)**.
  - Workflows: none detected (no recent `gh run` output).
  - Secret scanning alerts: none returned.

- **OrazioP26/Novl-desktop (private)**
  - Branch protection check returned **403**: GitHub reports this feature requires **GitHub Pro or making the repo public**.
  - Collaborators with push: **anthonytast**, **Markus112105**.
  - Secret scanning: reported **disabled** (likely due to plan/feature availability).

### Dependencies
- `novl-dashboard`: `npm audit` reports **5 moderate** vulnerabilities, all in the Vite/Vitest toolchain:
  - `esbuild` advisory (dev-server request/response exposure) via `vite`.
  - Suggested fix path: **upgrade `vitest` to 4.x** (semver-major) which pulls patched deps.
  - Note: primarily a **dev-time** risk (but still worth patching; dev servers often run on laptops on shared networks).

### Clawdbot
- Gateway status:
  - **bind=loopback (127.0.0.1)**, port 18789
  - **auth=token** enabled
  - Overall: good default exposure posture (local-only).
- Config review:
  - `~/.clawdbot/clawdbot.json` contains multiple API keys/tokens in plaintext (expected, but treat as sensitive).
  - Quick workspace scan found **no matching leaked tokens committed** in `/Users/oraziopetito/clawd`.

## Risk level
- **Overall: Medium**
  - Medium mainly due to: lack of branch protections on a public repo + private repo without protection capability + moderate dependency vulns (dev toolchain) + plaintext local key material.

## Recommended actions (ordered)
1) **Protect `Jarvis-board` main branch** (quick win)
   - Require PRs; restrict force-push; optionally require signed commits.
2) **Review `Novl-desktop` access**
   - Confirm collaborators still need push; downgrade/remove if not.
   - Consider GitHub Pro (or moving to an org plan) to enable branch protection on private repos.
3) **Patch dev toolchain vulns**
   - Upgrade `vitest` (major) and re-run `npm audit`.
4) **Enable automated scanning where possible**
   - Dependabot alerts + PRs; CodeQL on eligible repos.
5) **Harden Clawdbot secret storage**
   - Ensure `chmod 600 ~/.clawdbot/clawdbot.json`.
   - Consider 1Password/Keychain-backed injection for long-lived API keys; rotate if exposure suspected.

## Notes / blockers
- If you want me to audit Vercel next time, attach an authenticated tab via **Clawdbot Browser Relay** (Chrome extension) or install/configure the `vercel` CLI.
