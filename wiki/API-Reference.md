# API Reference

All routes are Next.js App Router route handlers in `app/api/`.

## Document Generation

Five parallel routes, identical shape. Each trims the input JSON differently and uses a different Claude prompt.

### POST /api/generate/{slug}

**Slugs:** `overview`, `mood-and-tone`, `scene-breakdown`, `storyboard-prompts`, `poster-concepts`

**Request:**
```json
{ "jsonData": "<screenplay JSON string>", "apiKey": "sk-ant-..." }
```
`apiKey` is optional — falls back to `ANTHROPIC_API_KEY` env var.

**Response:**
```json
{ "content": "# Document Title\n\n## Section..." }
```

**Errors:** `400` missing jsonData, `401` invalid API key, `429` rate limited (retried 3x internally), `500` generation failed.

**Caching:** SHA256(jsonData) → `.cache/{slug}-{hash}.md`. Same JSON = instant cache hit.

---

## Image Generation

Four routes, each targeting a different image type. All use the same model and LoRA.

### POST /api/generate-image
Storyboard frames. 1280x720.

**Request:**
```json
{ "prompt": "scene description...", "camera": "Wide shot...", "stylePrefix": "optional override" }
```

### POST /api/generate-portrait
Character portraits. 720x720.

**Request:**
```json
{ "description": "character description...", "name": "CHARACTER", "stylePrefix": "optional" }
```

### POST /api/generate-prop
Prop reference sketches. 720x720.

**Request:**
```json
{ "name": "prop name", "notes": "special requirements", "stylePrefix": "optional" }
```

### POST /api/generate-poster-image
Poster concepts. 720x1008.

**Request:**
```json
{ "prompt": "poster concept description...", "stylePrefix": "optional" }
```

**All image routes respond:**
```json
{ "url": "/api/serve-image/uuid.jpg" }
```

**Errors:** `400` missing required field, `500` fal.ai failure.

---

## Image Serving

### GET /api/serve-image/[filename]

Serves JPEGs from `.cache/images/`. Filename must match `/^[\w-]+\.jpg$/`.

**Headers:** `Cache-Control: public, max-age=31536000` (1 year).

---

## Section Regeneration

### POST /api/regenerate-section

Hotswap a single markdown section without regenerating the full document.

**Request:**
```json
{ "sectionKey": "overview/taglines", "jsonData": "...", "apiKey": "optional" }
```

**Supported keys:** `overview/taglines`, `mood-and-tone/color-palette`, `mood-and-tone/music`

**Response:**
```json
{ "content": "## Taglines\n- tagline 1\n- tagline 2\n- tagline 3" }
```

### POST /api/regenerate-prompt

Generate an alternate storyboard prompt for the same scene.

**Request:**
```json
{ "prompt": "current prompt", "slugLine": "INT. HOUSE - NIGHT", "apiKey": "optional" }
```

**Response:**
```json
{ "prompt": "new visual interpretation..." }
```

---

## TMDB

### POST /api/tmdb-search

Batch lookup film posters and metadata from TMDB.

**Request:**
```json
{ "queries": [{ "title": "The Seventh Seal", "year": 1957 }] }
```

**Response:**
```json
{ "resolved": [{ "query": "The Seventh Seal", "tmdb_id": 490, "title": "The Seventh Seal", "year": 1957, "poster_url": "https://image.tmdb.org/..." }] }
```

---

## Dev-Only Routes

### POST /api/save-demo
Snapshots current project as `lib/demo-project.ts` + copies images to `public/demo-images/`.

### POST /api/save-cached
Saves current project to `.cache/projects/` for title-match fake generation.

### POST /api/save-local
Saves a markdown file to `~/Desktop/greenlight/`.

```json
{ "filename": "overview.md", "content": "# Overview..." }
```
