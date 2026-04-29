# Deployment Guide: edeinaCalculator

**Repo:** https://github.com/crispyastrologer/edeinaCalculator
**Live URL:** https://edeina-calculator.vercel.app (update this once connected)

This file gives Claude standing instructions for maintaining and deploying this project.
Read it at the start of every session. Follow these rules automatically without being asked.

---

## Project Architecture

This is a **TanStack Start** app built via Lovable. It is a full-stack framework, not a plain
static Vite app. It produces both client and server bundles (`dist/client/`, `dist/server/`).

**Hosting platform: Vercel** — the only correct choice for this stack.
Do NOT attempt to deploy to GitHub Pages. It is static-only and incompatible with TanStack Start.

---

## Rule 1 — Do NOT add `base` to `vite.config.ts`

The project uses `@lovable.dev/vite-tanstack-config`. Do not override or modify this config
unless explicitly instructed. In particular, do NOT add `base: '/edeinaCalculator/'` —
that was for GitHub Pages and does not apply here.

If you need to extend the Vite config, do it additively:
```ts
// vite.config.ts
import { defineConfig } from '@lovable.dev/vite-tanstack-config'

export default defineConfig({
  // only add things here if specifically needed
})
```

---

## Rule 2 — Never commit `dist/`

The build output must never be tracked in git. Vercel builds it fresh on every deploy.

Ensure `.gitignore` always contains:
```
dist/
node_modules/
.env
.env.local
```

If `dist/` is already tracked, remove it:
```bash
git rm -r --cached dist/
git commit -m "chore: stop tracking dist"
```

---

## Rule 3 — Deployment is via Vercel, connected to GitHub

Deployment is automatic. Every push to `main` triggers a Vercel build and deploy.
No GitHub Actions workflow is needed — Vercel handles this natively.

**One-time setup (done in the Vercel UI, not in code):**
1. Go to https://vercel.com/new
2. Import the repo: `crispyastrologer/edeinaCalculator`
3. Vercel will auto-detect TanStack Start — accept the defaults
4. Click Deploy

After that, every `git push origin main` deploys automatically.

**To check deployment status:**
https://vercel.com/dashboard (find the edeinaCalculator project)

---

## Rule 4 — Environment variables go in Vercel dashboard, not in code

Any secrets or API keys must be added in:
https://vercel.com/dashboard → edeinaCalculator → Settings → Environment Variables

Variables prefixed with `VITE_` are exposed to the client bundle.
Variables without that prefix are server-only.

Never hardcode secrets in source files. Never commit `.env` files.

For local development, use a `.env.local` file (already gitignored):
```
VITE_EXAMPLE_KEY=your-value-here
```

---

## Rule 5 — Use `npm ci` locally for clean installs

When setting up from scratch or after pulling major changes:
```bash
npm ci        # exact versions from package-lock.json
```

Use `npm install` only when adding new packages. Always commit `package-lock.json`.

---

## Rule 6 — Always verify the build locally before pushing

```bash
npm run build
npm run start  # or npm run preview, depending on TanStack Start version
```

If the build fails locally, it will fail on Vercel. Fix it locally first.

`npm run dev` is for development only — always do a real build check before pushing
anything that changes routing, config, or dependencies.

---

## Diagnosing Deployment Issues

If the Vercel deploy fails or the live site looks wrong, check in this order:

1. **Build fails on Vercel** → Run `npm run build` locally. Fix any errors before pushing.
2. **App works locally but crashes on Vercel** → Check for missing environment variables in the Vercel dashboard (Rule 4).
3. **Blank page / broken styles** → Check browser DevTools console for 404s. May be a missing asset or wrong import path.
4. **Stale content on live site** → Check https://vercel.com/dashboard that the latest deploy succeeded. If it did, hard-refresh (`Ctrl+Shift+R`).
5. **`npm ci` fails in Vercel** → `package-lock.json` is missing or out of sync. Run `npm install` locally and commit the lockfile.
6. **Lovable-generated code broke something** → Check git diff carefully before pushing. Lovable sometimes changes config files.

---

## Sync Workflow (day-to-day)

```bash
# Before starting work — always pull first
git pull origin main

# During development
npm run dev

# Before pushing — verify the production build works
npm run build

# Push to trigger automatic Vercel deployment
git add .
git commit -m "your message"
git push origin main

# Vercel deploys automatically (~1–2 min)
# Check: https://vercel.com/dashboard
```

---

## Working with Lovable

Lovable may modify `vite.config.ts`, `package.json`, routing files, or other config.
After any Lovable session, before pushing:

1. Run `git diff` to review what changed
2. Run `npm run build` to confirm the build still works
3. Push only when the build is clean

If Lovable breaks the build, use `git stash` or `git checkout -- <file>` to revert specific files.

---

## File Checklist

Every time you touch deployment-related config, verify these are correct:

| File | Purpose | Should exist? |
|---|---|---|
| `vite.config.ts` | TanStack Start config (do not add `base`) | ✅ Yes |
| `.gitignore` | Excludes `dist/`, `node_modules/`, `.env` | ✅ Yes |
| `package-lock.json` | Locks dependency versions | ✅ Yes, committed |
| `.env.local` | Local env vars | ✅ Yes, but gitignored |
| `dist/` | Build output | ❌ Never committed |
| `.github/workflows/deploy.yml` | GitHub Actions deploy | ❌ Not needed — Vercel handles this |