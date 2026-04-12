# Wizard Flow

## Purpose

The wizard is a 4-step linear flow that takes the user from "I have a screenplay" to "I have a pre-production bible." It lives in `components/wizard/` and is rendered by the `/` route.

## Steps

| Step | Component | What happens |
|------|-----------|-------------|
| 1. Instructions | `step-instructions.tsx` | Shows how-to steps. Checks `cached-projects.ts` for title-matched pre-cached projects. |
| 2. JSON Input | `step-json-input.tsx` | Textarea for pasting screenplay JSON. Validates against `schema.ts` on submit. Shows inline errors. |
| 3. Generating | `step-generating.tsx` | Fires 5 parallel Claude API calls. Call-sheet progress UI with per-document elapsed time, cinema vocabulary (Queued → Rolling → In the can). |
| 4. Results | `step-results.tsx` | Tabbed viewer with 8 tabs: Overview, Mood & Tone, Scenes, Locations, Cast & Crew, Production Design, Identity, Posters. |

## WizardShell (Orchestrator)

**Location:** `components/wizard/wizard-shell.tsx`

The root component that owns all project state. Key responsibilities:

- **Hydration** — loads SavedProject from localStorage on mount, restores to step 4 if documents exist
- **Step management** — linear progression, back button returns to step 2
- **Document generation** — fires 5 parallel API calls via `generateAllDocuments()`
- **Image management** — passes image state + callbacks to viewers, handles bulk "Generate all" across types
- **Persistence** — saves to localStorage on every state change
- **Settings** — manages API keys, image style prompts, theme toggle via header menu dialog

## Header Menu

**Location:** `components/wizard/header-menu.tsx`

Three-dot menu containing all secondary actions:

- Generate all images (with progress + cancel)
- Share (opens `/share` in new tab)
- Download all / Download JSON
- Theme toggle (light/dark)
- Settings (API keys + image style prompts)
- About
- Save as demo / Save to cache (dev-only)

## Fake Generation Path

When a user submits JSON with a title matching a pre-cached project in `lib/cached-projects.ts`, the generating step shows a fake 11-second progression instead of real API calls. Documents load from cache, images are not included (user generates them live). This makes demos instant.

## Related

- [Data Flow](../Data-Flow.md) — how state moves through the wizard
- [Viewers](Viewers.md) — the components rendered in step 4
- [Image Generation](ImageGeneration.md) — how images are generated from viewers
