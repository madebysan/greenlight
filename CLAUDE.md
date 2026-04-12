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
- Claude Haiku 4.5 for document generation (16384 max tokens)
- FLUX dev + Gesture Draw LoRA (fal.ai `fal-ai/flux-lora`) for all image generation (~$0.035/image). LoRA config, style prefixes, and negative prompt in `lib/image-prompts.ts`
- TMDB REST API for poster lookups on Similar Moods + Soundtrack References
- Fonts: Space Grotesk + Space Mono (body), full Google Fonts catalog for title treatment
- Dev server: port 3001
- API keys: `.env.local` (`ANTHROPIC_API_KEY`, `FAL_KEY`, `TMDB_API_KEY`) or Settings dialog in-browser
- Cache: `.cache/` (API responses) — dev only, gitignored. Silently skipped on Vercel (read-only filesystem)
- Image gen returns fal.ai CDN URLs directly (no local filesystem caching)
- `acceleration: "regular"` on all image routes for ~40% faster generation
- Committed demo assets: `public/demo-images/` (used by /demo and /share)
- Active project: localStorage key `greenlight-project` (single-project architecture)
- Cached projects (title-match fake-gen): `lib/cached-projects.ts` + dev-only `/api/save-cached`
- Demo snapshot: `lib/demo-project.ts` + dev-only `/api/save-demo`
- **Deployed:** Vercel at `greenlight-app-red.vercel.app` with password gate (`ACCESS_PASSWORD` env var)
- All API keys set as Vercel env vars (Claude, fal.ai, TMDB) — users don't need their own keys
- Password gate: `components/password-gate.tsx` + `/api/verify-access` — skips itself when `ACCESS_PASSWORD` not set (dev mode)

## Decision rule

When in doubt: *will this make A24 lean forward?* If yes, do it. If no, skip it.
