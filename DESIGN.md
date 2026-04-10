# Design System — Greenlight

Runway-inspired dark creative tool aesthetic for filmmakers.

## Atmosphere
Dark, cinematic, professional. Media-forward — generated images pop against the dark background. Feels like a tool that belongs in a filmmaker's workflow, not a generic SaaS dashboard.

## Colors (OKLCH)
- **Background:** `oklch(0.13 0.005 270)` — near-black with subtle cool/blue undertone
- **Card:** `oklch(0.17 0.005 270)` — slightly elevated surface
- **Muted:** `oklch(0.20 0.005 270)` — secondary surfaces
- **Primary:** `oklch(0.65 0.2 280)` — violet accent for active states, buttons, focus rings
- **Foreground:** `oklch(0.95 0 0)` — high-contrast white text
- **Muted foreground:** `oklch(0.55 0.01 270)` — secondary text
- **Border:** `oklch(1 0 0 / 8%)` — barely-there white borders
- **Destructive:** `oklch(0.65 0.2 25)` — red for delete actions

### Badge Colors (dark-safe pattern)
All status badges use `bg-{color}-500/15 text-{color}-400` — transparent background with bright text that works on dark surfaces.
- **INT scenes:** amber-500/15, amber-400
- **EXT scenes:** sky-500/15, sky-400
- **Success:** emerald-500/15, emerald-400
- **VFX:** violet-500/15, violet-400
- **Complexity high:** red-500/15, red-400

## Typography
- **Sans:** Space Grotesk (`--font-space-grotesk`) — geometric with personality, slightly unusual proportions
- **Mono:** Space Mono (`--font-space-mono`) — same family, used for JSON input, prompts, code blocks
- **Scale:** 10px labels, 11px chips/metadata, 12px descriptions, 13px body, 14-15px taglines/emphasis, 18-20px headings

## Shape Language
- **Border radius:** 0.625rem base (10px), cards use `rounded-xl` (14px)
- **Borders:** 1px, `oklch(1 0 0 / 8%)` — subtle, almost invisible
- **Cards:** Minimal elevation through slightly lighter background, not shadow

## Spacing
- **Section gaps:** `mb-6` to `mb-8` between major sections
- **Card padding:** `p-4` standard, `p-5` for rich content areas
- **Chip/badge padding:** `px-1.5 py-0.5` or `px-2 py-0.5`

## Image Generation Style
All AI-generated images share a consistent visual language:
- **Style:** Black felt-tip marker on white paper, production art style
- **Storyboards:** Landscape 16:9, inside rectangular panel borders, with camera movement arrows
- **Posters:** Portrait 5:7 (720x1008), no text/lettering
- **Portraits:** Square, head and shoulders, centered
- **Rules:** Strictly B&W. No color, no text, no signatures, no watermarks.

## Patterns
- **Tabbed navigation:** Horizontal tabs with underline indicator for top-level document switching
- **Sub-tabs:** Same pattern nested (e.g., Production > Characters/Locations/Design/Technical)
- **Collapsible sections:** Chevron + uppercase label + divider line + count
- **Batch actions:** "Generate all X" button positioned in section header, with progress counter and cancel
- **Inline editing:** "Edit" button toggles field to input/textarea, "Save"/"Cancel" to commit

## Shared Components
- `CollapsibleSection` — reusable in production-matrices-viewer.tsx
- `SectionHeader` / `SectionActions` — reusable in marketing-brief-viewer.tsx
- `SceneEditForm` — inline form in scene-breakdown-viewer.tsx

## Decisions
- **Dark mode only** — no light mode toggle. The dark aesthetic is part of the identity. (2026-04-10)
- **No deployment** — local-only tool. File-based cache doesn't work on serverless. (2026-04-10)
- **Consistent B&W sketch style** — all generated images use the same marker-on-paper style for visual cohesion. (2026-04-10)
- **Violet primary accent** — distinguishes from typical blue SaaS tools, feels more creative/cinematic. (2026-04-10)

## Anti-patterns
- Light-mode color classes (bg-sky-50, text-amber-700) — always use /15 opacity + 400 shade pattern for dark backgrounds
- "Regenerate" buttons that rewrite the entire document — be specific about what's being regenerated
- Text in AI-generated images — FLUX produces garbled text. Suppress with "No text, no labels" in prompt.
