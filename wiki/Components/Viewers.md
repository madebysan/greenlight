# Viewers

## Purpose

Viewers are display components that parse generated markdown documents (or raw screenplay JSON) into structured UI. Each viewer knows its document's markdown format and uses regex to extract sections into typed data structures.

All viewers live in `components/viewers/`.

## Viewer → Document Mapping

| Viewer | Parses | Data Source |
|--------|--------|------------|
| `overview-viewer.tsx` | `## Logline`, `## Taglines`, `## Synopsis`, `## Film Identity`, `## Themes`, `## Scope` | Overview document (markdown) |
| `mood-and-tone-viewer.tsx` | `## Atmosphere`, `## Tonal Descriptors`, `## Color Palette`, `## Music & Sound`, `## Reference Points`, `## Similar Moods` | Mood & Tone document (markdown) |
| `scene-breakdown-viewer.tsx` | `### Scene N:` blocks with nested fields | Scene Breakdown document (markdown) + screenplay JSON |
| `storyboard-viewer.tsx` | `### Scene N:` blocks with `**Prompt:**`, `**Camera:**`, `**Lighting:**` | Storyboard Prompts document (markdown) |
| `poster-concepts-viewer.tsx` | `## Category:` groups with `**Concept N:**` blocks, `**AI Prompt:**` | Poster Concepts document (markdown) |
| `identity-viewer.tsx` | Color palette from Mood & Tone markdown | Mood & Tone document (markdown) |
| `posters-viewer.tsx` | Generated poster images | `posterImages` state |
| `cast-and-crew-viewer.tsx` | Characters + `computeInsights()` | Screenplay JSON directly |
| `locations-viewer.tsx` | Locations + scene cross-references | Screenplay JSON directly |
| `production-viewer.tsx` | Props + wardrobe notes across scenes | Screenplay JSON directly |

## Parsing Pattern

Every markdown-based viewer follows the same pattern:

```typescript
function parseOverview(md: string): ParsedOverview {
  const sections = md.split(/^## /m).slice(1);
  for (const section of sections) {
    const [heading, ...bodyLines] = section.split("\n");
    const h = heading.toLowerCase().trim();
    if (h === "logline") { /* extract */ }
    else if (h === "synopsis") { /* extract */ }
    // ...
  }
  return result;
}
```

This regex-based approach means the Claude prompts and the viewer parsers are coupled — if the prompt changes its markdown headings, the parser breaks. This is intentional: it keeps things simple and the prompts are stable.

## Viewer Features

### Interactive Elements

| Feature | Where | How |
|---------|-------|-----|
| Tagline shuffle | Overview | `POST /api/regenerate-section` with `overview/taglines` |
| Color palette reshuffle | Identity | `POST /api/regenerate-section` with `mood-and-tone/color-palette` |
| Music shuffle | Mood & Tone | `POST /api/regenerate-section` with `mood-and-tone/music` |
| Storyboard image gen | Scenes / Storyboard | `POST /api/generate-image` per scene |
| Portrait gen | Cast & Crew | `POST /api/generate-portrait` per character |
| Prop image gen | Production Design | `POST /api/generate-prop` per prop |
| Poster image gen | Posters | `POST /api/generate-poster-image` per concept |
| Expand/collapse | Scenes, Locations, Posters | Local component state |
| Disable/enable cards | Cast & Crew | `disabledItems` persisted to SavedProject |

### Bulk Generation

Several viewers support "Generate all" buttons that iterate through items sequentially with a cancel mechanism:

```typescript
const cancelRef = useRef(false);
for (let i = 0; i < toGenerate.length; i++) {
  if (cancelRef.current) break;
  await fetchImage(toGenerate[i]);
  setProgress({ done: i + 1, total: toGenerate.length });
}
```

### Insights (Cast & Crew)

The `computeInsights()` function in `cast-and-crew-viewer.tsx` scans the screenplay JSON for 15 situational patterns (stunts, VFX, weapons, pyro, night shoots, etc.) and surfaces them as actionable advice. Baseline crew roles (director, DP, producer) are deliberately excluded — they're assumed.

## TMDB Integration

`mood-and-tone-viewer.tsx` fetches real film posters for the "Similar Moods" and "Soundtrack References" sections:

1. Claude generates film titles in the markdown
2. Viewer parses titles + years
3. Viewer calls `POST /api/tmdb-search` with batch queries
4. API returns TMDB poster URLs
5. Viewer renders poster cards with images

## Related

- [Wizard](Wizard.md) — the step flow that renders viewers
- [Image Generation](ImageGeneration.md) — how the FLUX pipeline works
- [Data Flow](../Data-Flow.md) — how data reaches viewers
