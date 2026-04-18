# Project Structure

## Top-Level Layout

```
greenlight/
  app/                    # Next.js App Router (pages + API routes)
  components/             # React components (wizard, viewers, UI primitives)
  lib/                    # Core logic (types, prompts, caching, persistence)
  public/                 # Static assets (logo, demo images)
  wiki/                   # This documentation
  .cache/                 # Dev-only caches (gitignored)
```

## App Directory

```
app/
  layout.tsx              # Root layout — fonts, theme init, <PasswordGate> + <ApiKeysProvider>
  page.tsx                # / — renders WizardShell + JSON-LD SoftwareApplication
  globals.css             # Tailwind base + custom utilities (shadow-paper, shadow-pill, etc.)
  icon.png                # Favicon (4-triangle diamond mark, 1060x1060)
  robots.ts               # /robots.txt — allow crawl, disallow /api/ + /share
  sitemap.ts              # /sitemap.xml — lists /, /demo, /demo/red-balloon
  demo/page.tsx           # /demo — Night of the Living Dead (cached snapshot) + per-page metadata
  demo/red-balloon/page.tsx # /demo/red-balloon — The Red Balloon (cached snapshot) + per-page metadata
  share/page.tsx          # /share — read-only bible view
  api/
    extract-screenplay/   # PDF → JSON via Claude Sonnet 4.6 streaming (maxDuration=300, 32k tokens)
    generate/             # 5 Claude document generation routes
      overview/
      mood-and-tone/
      scene-breakdown/
      storyboard-prompts/
      poster-concepts/
    generate-image/       # Storyboard frames (FLUX, 1280x720)
    generate-portrait/    # Character portraits (FLUX, 720x720)
    generate-prop/        # Prop reference sketches (FLUX, 720x720)
    generate-poster-image/# Poster concepts (FLUX, 720x1008)
    serve-image/[filename]/ # Static file server for cached images
    tmdb-search/          # TMDB poster lookups (accepts user key)
    regenerate-section/   # Hotswap single markdown sections
    regenerate-prompt/    # Generate alternate storyboard prompts
    verify-access/        # Password gate verification (no-op when ACCESS_PASSWORD unset)
    save-local/           # Export to ~/Desktop/greenlight
    save-cached/          # Dev-only: cache current project
    save-demo/            # Dev-only: snapshot as demo project
```

All API routes accept `apiKey` in the request body with `process.env.X` as fallback — see [API-Reference](API-Reference.md).

## Components

```
components/
  document-viewer.tsx     # Markdown renderer with color swatch support
  viewers/                # 11 specialized document/data viewers
    overview-viewer.tsx           # Parses Overview markdown → structured hero
    mood-and-tone-viewer.tsx      # Atmosphere, palette, TMDB posters, soundtracks
    scene-breakdown-viewer.tsx    # Collapsible scene cards with stats
    storyboard-viewer.tsx         # Storyboard prompts + image generation
    poster-concepts-viewer.tsx    # Poster concept cards + image generation
    identity-viewer.tsx           # Color palette + title treatment (Google Fonts)
    posters-viewer.tsx            # Generated poster image gallery
    cast-and-crew-viewer.tsx      # Character portraits + production insights
    locations-viewer.tsx          # Location cards grouped by setting
    production-viewer.tsx         # Props + wardrobe cross-referenced from scenes
    poster-carousel.tsx           # Simple image carousel
    title-treatment.tsx           # Live font preview with Google Fonts
  wizard/                 # 4-step wizard flow
    wizard-shell.tsx              # Root state manager + background image task queue
    step-instructions.tsx         # Step 1: PDF (disabled, "Soon") + Paste JSON + cached lookup
    step-json-input.tsx           # (legacy) JSON paste + validation
    step-generating.tsx           # Step 2: parallel Claude docs + onDocReady hook
    step-results.tsx              # Step 3: tabbed viewer container
    header-menu.tsx               # Settings, About, Share, Theme toggle
    about-dialog.tsx              # About dialog
    api-keys-dialog.tsx           # Onboarding modal — Claude required, fal.ai + TMDB optional
  demo/
    demo-content.tsx              # Shared read-only bible view for /demo and /demo/red-balloon
  share/
    shareable-view.tsx            # Full-bible print-friendly layout
  password-gate.tsx               # Gate shown only when ACCESS_PASSWORD env is set (off in prod)
  ui/                     # shadcn primitives + custom components
    button.tsx, card.tsx, dialog.tsx, alert-dialog.tsx, textarea.tsx
    section-head.tsx              # Numbered section heading with label pill
    inline-chip.tsx               # SectionLabelPill + InlineChip
    shuffle-button.tsx            # Shared ShuffleButton + useShuffleState
    editable-text.tsx             # Hover-pencil inline edit component
```

## Library

```
lib/
  schema.ts               # ScreenplayData types + validateScreenplayJson()
  claude.ts                # Anthropic SDK wrapper (retries, rate limits)
  image-prompts.ts         # LoRA config, style prefixes, negative prompt constants
  json-trimmer.ts          # 5 trim functions (reduce tokens for Claude)
  response-cache.ts        # SHA256 file-based cache
  reports.ts               # localStorage persistence (SavedProject) + key storage constants
  markdown-utils.ts        # Section-level markdown surgery
  utils.ts                 # cn() + downloadBlob()
  title-fonts.ts           # Google Fonts filtering + random selection
  google-fonts-catalog.json# 1929 font families metadata
  cached-projects.ts       # Pre-cached project lookups (dev-only)
  demo-project.ts          # Committed Night of the Living Dead snapshot
  sample-data.ts           # Sample screenplay JSON
  api-keys-context.tsx     # <ApiKeysProvider> + useApiKeys() + ensureKeys() modal gate
  site-url.ts              # getSiteUrl() — canonical base URL for SEO (metadataBase, robots, sitemap)
  demos/
    red-balloon.ts                # Committed The Red Balloon snapshot (second demo)
  prompts/                 # Claude system prompts
    stage-0.ts                    # Manual extraction prompt (for use in Claude.ai)
    overview.ts                   # Overview document generation
    mood-and-tone.ts              # Mood & Tone generation
    scene-breakdown.ts            # Scene Breakdown generation
    storyboard-prompts.ts         # Storyboard image prompt generation
    poster-concepts.ts            # Poster concept generation
```

## Important Files for New Readers

Start here, in this order:

1. **`CLAUDE.md`** — project context, stack, decision rule
2. **`lib/schema.ts`** — the data model (ScreenplayData and its children)
3. **`components/wizard/wizard-shell.tsx`** — how state flows through the app
4. **`lib/image-prompts.ts`** — the Gesture Draw LoRA configuration
5. **`lib/prompts/overview.ts`** — representative Claude prompt (shows the prompt engineering approach)
