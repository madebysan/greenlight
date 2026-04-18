# Greenlight — Project Context for Claude

## READ FIRST

**Before doing anything on this project, read `presentation.md` in the project root.**

It captures the real goal of Greenlight: this is a **portfolio / demo project built to impress A24's creative team in a job interview.** It is not a product going to market. Every decision should be evaluated against: *"Will this make A24's creative team lean forward?"*

The `README.md` describes what Greenlight *is* publicly (a 0→1 tool for indie filmmakers). The `presentation.md` describes what it's actually *for* (a portfolio piece). Both framings are true — the public story is genuine — but when they conflict, **`presentation.md` wins**.

## Project docs (source of truth, in priority order)

1. **`presentation.md`** — the real goal, priorities, what to ignore. Read every session.
2. **`README.md`** — the public-facing story and tab structure.
3. **`backlog.md`** — everything we want to build, organized by topic.
4. **`plan.md`** — current session handoff, next steps, open questions.

## What this means practically

- **Prioritize taste, polish, and design sensibility** over feature completeness, test coverage, error handling, or scalability.
- **A24 films are the primary sample data** — not a legal risk, they're the entire point of the portfolio framing.
- **The Mood & Tone tab is the most important tab** for this audience. Protect its scope.
- **Happy-path only.** Don't build edge-case handling unless it would show up in a 5-minute demo.
- **No auth, no accounts, no payment, no analytics.** None of that serves the goal.
- **Dark mode is the default** — matches A24's aesthetic instinct.

## Stack quick reference

- Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- Claude Haiku 4.5 for document generation (16384 max tokens on the 5 doc routes; 32k + streaming on the PDF extract route)
- FLUX dev + Gesture Draw LoRA (fal.ai `fal-ai/flux-lora`) for all image generation (~$0.035/image). LoRA config, style prefixes, and negative prompt in `lib/image-prompts.ts`
- TMDB REST API for poster lookups on Similar Moods + Soundtrack References
- Fonts: Space Grotesk + Space Mono (body), full Google Fonts catalog for title treatment
- Dev server: port 3001
- Cache: `.cache/` (API responses) — dev only, gitignored. Silently skipped on Vercel (read-only filesystem)
- Image gen returns fal.ai CDN URLs directly (no local filesystem caching)
- `acceleration: "regular"` on all image routes for ~40% faster generation
- Committed demo assets: `public/demo-images/` (used by /demo and /share)
- Active project: localStorage key `greenlight-project` (single-project architecture)
- Cached projects (title-match fake-gen): `lib/cached-projects.ts` + dev-only `/api/save-cached`. EEAAO has full images in `public/demo-images/eeaao/`
- Demo snapshot: `lib/demo-project.ts` + dev-only `/api/save-demo`
- Parallel Claude docs (`step-generating.tsx`): all 5 doc routes fire via `Promise.all`; each emits `onDocReady(slug, content)` the moment it lands so dependent work can start.
- Background image task queue (`wizard-shell.tsx`): dedupe Set + 500ms stagger + payment-error abort + cancel support. Portraits/props auto-fire on JSON submit; storyboards/posters auto-fire when their Claude doc lands.
- **Deployed:** Vercel at `greenlight-public.vercel.app` (will redirect to `greenlight.santiagoalonso.com` once DNS propagates). No password gate. Zero server-side keys.

## Keys architecture (public release)

Each API call carries the user's own key. The Greenlight server has no keys — visitors must bring their own.

- `lib/api-keys-context.tsx` — `<ApiKeysProvider>` + `useApiKeys()` hook. Exposes `apiKey` (Claude), `falKey`, `tmdbKey` + setters + `ensureKeys({requireFal?})`.
- `components/wizard/api-keys-dialog.tsx` — onboarding modal. Claude required, fal.ai + TMDB optional.
- All 6 Claude routes (`/api/generate/*`, `/api/regenerate-section`, `/api/regenerate-prompt`, `/api/extract-screenplay`) and all 4 fal routes (`/api/generate-image`, `-portrait`, `-prop`, `-poster-image`) + `/api/tmdb-search` accept `apiKey` in the body with `process.env.X` as fallback.
- Local dev: put keys in `.env.local` to bypass the modal. Deployed Vercel: env vars NOT set, modal is the only path.
- `ensureKeys()` is gated at every user action: PDF upload, Paste JSON, viewer regenerate, viewer image generation. Cached-project paths (EEAAO title match) skip the gate entirely.

## PDF upload — disabled in UI

`/api/extract-screenplay` works end-to-end with streaming + 32k tokens + forgiving JSON parser + 5-minute `maxDuration`, but the mode switcher in `step-instructions.tsx` shows "Upload PDF" as a `Soon` badge and falls through to Paste JSON. Vercel's serverless infra can't reliably accommodate feature-length PDF extraction across the free/Pro edge+function timeout split. Flip back on with a 2-line change when we find a fix (keep streaming API). Do NOT remove the route or UploadMode function — both stay in the tree.

## SEO

- `lib/site-url.ts` resolves canonical base URL (NEXT_PUBLIC_SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → localhost).
- `app/layout.tsx` sets `metadataBase`, `alternates.canonical: "/"`, title template `"%s — Greenlight"`.
- Per-page metadata on `/demo` and `/demo/red-balloon` (had to drop `"use client"` from both page files).
- `app/robots.ts` + `app/sitemap.ts` auto-generate `/robots.txt` + `/sitemap.xml`.
- JSON-LD `SoftwareApplication` on home (`app/page.tsx`).

## Decision rule

When in doubt: *will this make A24 lean forward?* If yes, do it. If no, skip it.
