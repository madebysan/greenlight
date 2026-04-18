# Getting Started

## Prerequisites

- Node.js 18+
- npm

## API Keys

You need at least one key to use Greenlight:

| Key | Required for | Get it from |
|-----|-------------|-------------|
| `ANTHROPIC_API_KEY` | Document generation (Claude Haiku 4.5) | [console.anthropic.com](https://console.anthropic.com) |
| `FAL_KEY` | Image generation (FLUX + LoRA) | [fal.ai/dashboard](https://fal.ai/dashboard) |
| `TMDB_API_KEY` | Film poster lookups (Similar Moods, Soundtracks) | [developer.themoviedb.org](https://developer.themoviedb.org) |

Keys can be set in `.env.local` or entered at runtime via the Settings dialog (gear icon in the header).

## Setup

```bash
git clone <repo>
cd greenlight
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
FAL_KEY=...
TMDB_API_KEY=...
```

## Run

```bash
npm run dev
```

Opens at [http://localhost:3001](http://localhost:3001).

## First Use

1. Open the app — you'll see the instructions page
2. Paste screenplay JSON (see `lib/prompts/stage-0.ts` for the extraction prompt to use with Claude.ai, Gemini Pro, or ChatGPT)
3. Click "Generate" — if no API keys are set, the onboarding modal appears asking for Claude (required), fal.ai (optional, enables images), and TMDB (optional, enables Mood & Tone poster thumbs)
4. All 5 documents generate in parallel (~30-60s). If a fal key is present, portraits + props auto-fire in the background; storyboards + posters fire when their parent doc lands.
5. Browse the tabbed results: Overview, Mood & Tone, Scenes, Locations, Cast & Crew, Production Design, Identity, Posters
6. Individual image-generation buttons on each card still work for regenerating single assets

> **PDF upload** is visible as a coming-soon option — currently disabled because Vercel's serverless timeouts can't reliably handle feature-length script extraction. Paste JSON is the happy path.

## Demo Mode

Two demos available, both work without any keys:

- [http://localhost:3001/demo](http://localhost:3001/demo) — Night of the Living Dead (George A. Romero, 1968)
- [http://localhost:3001/demo/red-balloon](http://localhost:3001/demo/red-balloon) — The Red Balloon (Albert Lamorisse, 1956)

Public deployment: [greenlight-public.vercel.app](https://greenlight-public.vercel.app) (custom domain `greenlight.santiagoalonso.com` pending DNS setup).

## Costs Per Bible

| Service | Per unit | Typical count | Total |
|---------|----------|---------------|-------|
| Claude Haiku 4.5 | ~$0.005/doc | 5 documents | ~$0.025 |
| FLUX + LoRA | $0.035/image | ~42 images | ~$1.47 |
| TMDB | Free | ~8 lookups | $0 |
| **Total** | | | **~$1.50** |
