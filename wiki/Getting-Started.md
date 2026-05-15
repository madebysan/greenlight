# Getting Started

## Prerequisites

- Node 20 or newer
- npm
- Optional text provider key for live generation
- Optional fal.ai key for fresh image generation
- Optional TMDB key for poster thumbnails

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## First Live Generation

1. Convert a screenplay into Greenlight's structured JSON. The README notes Gemini Pro as san's current extraction path.
2. Paste the JSON into the app.
3. Pick a text provider and enter its API key.
4. Optionally enter fal.ai and TMDB keys.
5. Let the five text sections generate in parallel.
6. Review the eight deck tabs.

## Demo Routes

No API keys are needed for committed demo routes:

- `http://localhost:3000/demo`
- `http://localhost:3000/demo/get-out`
- `http://localhost:3000/demo/dune-part-one`
- `http://localhost:3000/demo/the-favourite`
- `http://localhost:3000/demo/past-lives`
- `http://localhost:3000/demo/red-balloon`

## Useful Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start local Next dev server |
| `npm run build` | Build production app |
| `npm run lint` | Run ESLint |
| `npm run prompt:compare` | Run prompt comparison workflow |
| `npm run prompt:tokens` | Estimate prompt token cost |

