<h1 align="center">Greenlight</h1>
<p align="center">AI-powered pre-production bible generator.<br>
Turn any screenplay into scene breakdowns, production worksheets, marketing briefs, storyboards, and poster concepts.</p>
<p align="center"><code>Next.js</code> <code>React 19</code> <code>Tailwind CSS 4</code> <code>Claude API</code> <code>FLUX Schnell</code></p>

---

## How It Works

1. **Extract** — Upload your screenplay PDF to Claude or ChatGPT with the built-in extraction prompt. Get structured JSON back.
2. **Paste** — Paste the JSON into the app (or use a sample: Jaws, Ex Machina).
3. **Generate** — AI creates 5 production documents automatically.
4. **Refine** — Edit inline, generate storyboard sketches, poster concepts, and character portraits. Add marketing sections on demand.

## Documents

| Tab | What It Does |
|-----|-------------|
| **Scene Breakdown** | Scene-by-scene analysis with locations, cast, props, VFX, emotional beats. Add, edit, and delete scenes. |
| **Production** | Department tabs: Characters (with AI portraits), Locations, Production Design (props & wardrobe), Technical (VFX, stunts, notes). |
| **Marketing Brief** | Film identity, logline, taglines, color palette, synopsis, comparables, audience. Expandable with Festival Strategy, Casting Wishlist, Distribution Positioning, and more. |
| **Storyboard** | Visual prompt per scene. Generate B&W sketch storyboards in batch, edit/rewrite prompts, side-by-side layout. |
| **Posters** | 15 poster concepts across 5 categories with color palettes, composition notes, and AI-generated sketch previews. |

## Image Generation

Storyboard frames, poster sketches, and character portraits are generated using FLUX Schnell (fal.ai) in a consistent black-and-white felt-tip marker production art style. All images are saved locally to `.cache/images/` and persist with your project.

## Setup

```bash
cd greenlight
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### API Keys

Configure via **Settings** in the sidebar:

| Key | Purpose | Get one at |
|-----|---------|-----------|
| Claude API Key | Document generation, prompt rewriting | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| fal.ai API Key | Image generation (storyboards, posters, portraits) | [fal.ai/dashboard](https://fal.ai/dashboard/keys) |

Or set them in `.env.local` for local development:

```
ANTHROPIC_API_KEY=sk-ant-...
FAL_KEY=...
```

## Tech Stack

- **Framework:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **AI:** Claude Haiku 4.5 (Anthropic), FLUX Schnell (fal.ai)
- **Fonts:** Space Grotesk + Space Mono
- **Theme:** Dark mode, Runway-inspired aesthetic

---

Made by [santiagoalonso.com](https://santiagoalonso.com)
