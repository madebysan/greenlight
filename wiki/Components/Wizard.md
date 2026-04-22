# Wizard Flow

## Purpose

The wizard is a 4-step linear flow that takes the user from "I have a screenplay" to "I have a pre-production bible." It lives in `components/wizard/` and is rendered by the `/` route.

## Steps

| Step | Component | What happens |
|------|-----------|-------------|
| 1. Instructions | `step-instructions.tsx` | Mode switcher with PDF Upload (disabled, `Soon` pill) + Paste JSON (active). Paste mode validates against `schema.ts` on submit and gates via `ensureKeys()`. EEAAO title-match bypasses the gate and triggers fake-gen. |
| 2. Generating | `step-generating.tsx` | Fires all 5 Claude doc routes concurrently via `Promise.all`. Emits `onDocReady(slug, content)` as each lands so images can start immediately. Call-sheet progress UI (Queued → Rolling → In the can). |
| 3. Results | `step-results.tsx` | Tabbed viewer with 8 tabs: Overview, Mood & Tone, Scenes, Locations, Cast & Crew, Production Design, Identity, Posters. |

## WizardShell (Orchestrator)

**Location:** `components/wizard/wizard-shell.tsx`

The root component that owns all project state. Key responsibilities:

- **Hydration** — loads SavedProject from localStorage on mount, restores to step 3 if documents exist
- **Step management** — linear progression, back button returns to step 1
- **Document generation** — hands off to `step-generating.tsx` which fires all 5 routes in parallel via `Promise.all`
- **Background image task queue** — single-worker queue with dedupe Set, 500ms stagger, cancel support, payment-error abort. Auto-enqueues portraits + props on JSON submit; storyboard + poster images enqueue via `onDocReady` callback when their parent Claude doc lands. Counter resets to `0/0` on idle; total clamps to `≥done` to prevent visual drift.
- **Persistence** — saves to localStorage on every state change (via `updateProject()`)
- **Settings dialog** — all three API keys (Claude, fal.ai, TMDB) + image style prompts + theme toggle. Reads/writes via the `useApiKeys()` context.

## ApiKeysDialog (Onboarding Modal)

**Location:** `components/wizard/api-keys-dialog.tsx`

Mounted by `<ApiKeysProvider>` in `lib/api-keys-context.tsx`. Opens whenever `ensureKeys({requireFal?})` detects missing required keys.

- **Claude** — required field (sk-ant-...)
- **fal.ai** — optional (fal-...). When `requireFal: true` (image-only actions), becomes required.
- **TMDB** — optional (shown only on the general onboarding modal, hidden when `requireFal`)
- Shows time + cost estimates: `~$0.70 text-only, ~$2–3 with images` · `~2–4 min text-only, ~3–5 min with images`
- Each field has a "Get a key ↗" link to its provider dashboard

## Header Menu

**Location:** `components/wizard/header-menu.tsx`

Three-dot menu containing all secondary actions:

- Generate all images (with progress + cancel)
- Share (opens `/share` in new tab)
- Download all / Download JSON / Download as PDF
- Theme toggle (light/dark)
- Settings (API keys — Claude + fal.ai + TMDB — and image style prompts)
- About
- Save as demo / Save to cache (dev-only)

## Fake Generation Path

When a user submits JSON with a title matching a pre-cached project in `lib/cached-projects.ts` (currently EEAAO), the generating step shows a fake progression instead of real API calls. Documents load from cache. Images are revealed through `fakeGenerateAllImages` using pre-committed assets in `public/demo-images/`. The keys modal is skipped for this path.

## Related

- [Data Flow](../Data-Flow.md) — how state moves through the wizard
- [Viewers](Viewers.md) — the components rendered in step 4
- [Image Generation](ImageGeneration.md) — how images are generated from viewers
