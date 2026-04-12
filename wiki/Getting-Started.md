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
2. Click "Get started" to move to JSON input
3. Paste screenplay JSON (see `lib/prompts/stage-0.ts` for the extraction prompt to use with Claude.ai or ChatGPT)
4. Click "Generate" — 5 documents generate in parallel (~30-60s)
5. Browse the tabbed results: Overview, Mood & Tone, Scenes, Locations, Cast & Crew, Production Design, Identity, Posters
6. Click image generation buttons on individual cards to create storyboards, portraits, props, and poster concepts

## Demo Mode

Visit [http://localhost:3001/demo](http://localhost:3001/demo) to see a pre-generated bible for Night of the Living Dead — no API keys needed.

## Costs Per Bible

| Service | Per unit | Typical count | Total |
|---------|----------|---------------|-------|
| Claude Haiku 4.5 | ~$0.005/doc | 5 documents | ~$0.025 |
| FLUX + LoRA | $0.035/image | ~42 images | ~$1.47 |
| TMDB | Free | ~8 lookups | $0 |
| **Total** | | | **~$1.50** |
