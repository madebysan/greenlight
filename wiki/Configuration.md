# Configuration

## Environment Variables

Set in `.env.local` (gitignored). All can alternatively be entered via the Settings dialog in-browser.

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | For doc generation | Claude Haiku 4.5 API key |
| `FAL_KEY` | For image generation | fal.ai API key |
| `TMDB_API_KEY` | For film lookups | TMDB v3 API key |

## localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `greenlight-project` | `SavedProject` JSON | Full project state (JSON, docs, images, overrides) |
| `greenlight-theme` | `"light"` \| `"dark"` | Theme preference (dark default) |
| `greenlight-image-prompts` | Partial `Record<ImagePromptKind, string>` | User style prefix overrides for image generation |
| `stp-api-key` | string | User-provided Claude API key (from Settings) |
| `stp-fal-key` | string | User-provided fal.ai key (from Settings) |

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
