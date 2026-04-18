# Configuration

## Environment Variables

Server-side env vars act as fallbacks when the user hasn't provided a key via the in-browser modal. **On the public deployment, none of these are set** — every visitor brings their own keys via the onboarding modal, which persists them to localStorage.

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Optional fallback | Claude API key — fallback for all 6 Claude routes when user hasn't set one |
| `FAL_KEY` | Optional fallback | fal.ai API key — fallback for all 4 image routes |
| `TMDB_API_KEY` | Optional fallback | TMDB v3 key — fallback for `/api/tmdb-search` (poster lookups on Mood & Tone tab) |
| `ACCESS_PASSWORD` | Optional | Password gate. Unset = gate disabled (public). Set = `<PasswordGate>` wraps the app. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical base URL for SEO (metadataBase, robots, sitemap). Falls back to `VERCEL_PROJECT_PRODUCTION_URL` → `localhost:3001`. Set to `https://greenlight.santiagoalonso.com` once DNS is live. |

Local dev: `.env.local` with the three API keys skips the modal entirely.

## localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `greenlight-project` | `SavedProject` JSON | Full project state (JSON, docs, images, overrides) |
| `greenlight-theme` | `"light"` \| `"dark"` | Theme preference (dark default) |
| `greenlight-image-prompts` | Partial `Record<ImagePromptKind, string>` | User style prefix overrides for image generation |
| `stp-api-key` | string | User-provided Claude API key |
| `stp-fal-key` | string | User-provided fal.ai key |
| `stp-tmdb-key` | string | User-provided TMDB key |
| `greenlight-access` | string | Password gate sessionStorage marker (only when ACCESS_PASSWORD is set) |

## File-Based Cache

All in `.cache/` (gitignored):

| Path | Content | Keying |
|------|---------|--------|
| `.cache/{slug}-{hash}.md` | Cached Claude responses | SHA256(jsonData).slice(0,12) |
| `.cache/images/{uuid}.jpg` | Storyboard frames | Random UUID |
| `.cache/images/portrait-{uuid}.jpg` | Character portraits | Random UUID |
| `.cache/images/prop-{uuid}.jpg` | Prop reference sketches | Random UUID |
| `.cache/images/poster-{uuid}.jpg` | Poster concepts | Random UUID |

Clear the entire cache by deleting `.cache/`.

## Theme Configuration

Dark mode is the default (set by inline `<script>` in `app/layout.tsx` to prevent FOUC). Theme is toggled via the header menu and persisted to `localStorage["greenlight-theme"]`.

Theme tokens are defined in `app/globals.css` using OKLCH color space with `.dark` class variants.

## Image Generation Config

Hardcoded in `lib/image-prompts.ts` (not user-configurable):

| Setting | Value |
|---------|-------|
| Model | `fal-ai/flux-lora` |
| LoRA | Gesture Draw v1 from HuggingFace |
| LoRA scale | 1.0 |
| Inference steps | 28 |
| Guidance scale | 3.5 |

User-configurable via Settings dialog:

| Setting | Storage | Default |
|---------|---------|---------|
| Storyboard style prefix | `greenlight-image-prompts.storyboard` | `gstdrw style, black ink on pure white paper...` |
| Portrait style prefix | `greenlight-image-prompts.portrait` | `gstdrw style, black ink on pure white paper...` |
| Prop style prefix | `greenlight-image-prompts.prop` | `gstdrw style, black ink on pure white paper, bold linework...` |
| Poster style prefix | `greenlight-image-prompts.poster` | `gstdrw style, black ink on pure white paper...` |

## Dev Server

Port 3001 (configured in `package.json` scripts).
