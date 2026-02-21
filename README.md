<h1 align="center">Script to Production</h1>
<p align="center">Generate pre-production documents from your screenplay using AI.<br>
Scene breakdowns, production matrices, marketing briefs, storyboard prompts, and poster concepts.</p>

## How It Works

1. **Extract** — Upload your screenplay PDF to Claude or ChatGPT with the extraction prompt. The AI returns structured JSON.
2. **Paste** — Paste the JSON output into the app. It validates the structure automatically.
3. **Generate** — The app sends your data to Claude Haiku and generates 5 production documents in sequence.
4. **Review & Edit** — Browse your production bible, edit sections inline, regenerate any section with one click, and download everything as markdown.

## Documents Generated

| Document | What It Contains |
|----------|-----------------|
| **Scene Breakdown** | Scene-by-scene analysis with locations, cast, and props |
| **Production Matrices** | Characters, locations, props, wardrobe, VFX/stunts cross-referenced |
| **Marketing Brief** | Film identity, logline, taglines, color palette, synopsis, comparables |
| **Storyboard Prompts** | Per-scene AI image prompts with camera, lighting, and mood metadata |
| **Poster Concepts** | Visual poster directions with color palettes and AI prompts |

## Setup

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Install & Run

```bash
git clone <repo-url>
cd script-to-production
npm install
```

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui, Radix UI
- **AI:** Anthropic Claude Haiku 4.5
- **Icons:** Lucide React
- **Markdown:** react-markdown + remark-gfm
- **Testing:** Vitest, Playwright

## Project Structure

```
app/
  api/generate/          # API routes for each document type
  page.tsx               # Main page (renders WizardShell)
components/
  wizard/                # Multi-step wizard flow
    wizard-shell.tsx     # Main shell with sidebar, steps, report history
    step-instructions.tsx
    step-json-input.tsx
    step-generating.tsx
    step-results.tsx     # Tabbed viewer for generated documents
  viewers/               # Document-specific viewers
    scene-breakdown-viewer.tsx
    production-matrices-viewer.tsx
    marketing-brief-viewer.tsx
    storyboard-viewer.tsx
    poster-concepts-viewer.tsx
  ui/                    # shadcn/ui components
lib/
  prompts/               # System prompts for each document type
  claude.ts              # Anthropic SDK wrapper with retry logic
  schema.ts              # JSON validation
  reports.ts             # localStorage report persistence
  json-trimmer.ts        # Trims JSON to fit context windows
```

## Features

- **Report History** — All generated reports are saved to localStorage. Switch between reports in the sidebar.
- **Inline Editing** — Edit film identity, logline, synopsis, and other sections directly in the viewer.
- **Regenerate** — One-click rewrite for any section (logline, taglines, color palette, synopsis).
- **Collapsible Sections** — Production matrices sections collapse/expand independently.
- **Act Grouping** — Storyboard scenes are grouped by act structure (parsed from markdown or auto-divided into 3 acts).
- **Download** — Download individual documents or all at once as markdown files.
- **Delete Confirmation** — Reports require confirmation before deletion.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude |

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
