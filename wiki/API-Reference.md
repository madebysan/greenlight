# API Reference

All routes are Next.js App Router route handlers in `app/api/`.

**Bring-your-own-keys:** Every paid route accepts `apiKey` in the body with `process.env.X` as fallback. On the public deployment (`greenlight-public.vercel.app`) no server env vars are set, so visitors must provide their own Claude + fal.ai + TMDB keys via the onboarding modal. The `apiKey` field is required in production and optional in local dev (where `.env.local` fills the gap).

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

Four routes, each targeting a different image type. All use the same model and LoRA. Each accepts `apiKey` in the body (fal.ai key, falls back to `FAL_KEY` env var) and configures fal via `fal.config({ credentials })` inside the handler.

### POST /api/generate-image
Storyboard frames. 1280x720.

**Request:**
```json
{ "prompt": "scene description...", "stylePrefix": "optional override", "apiKey": "fal-..." }
```

### POST /api/generate-portrait
Character portraits. 720x720.

**Request:**
```json
{ "description": "character description...", "name": "CHARACTER", "stylePrefix": "optional", "apiKey": "fal-..." }
```

### POST /api/generate-prop
Prop reference sketches. 720x720.

**Request:**
```json
{ "name": "prop name", "notes": "special requirements", "stylePrefix": "optional", "apiKey": "fal-..." }
```

### POST /api/generate-poster-image
Poster concepts. 720x1008.

**Request:**
```json
{ "prompt": "poster concept description...", "stylePrefix": "optional", "apiKey": "fal-..." }
```

**All image routes respond:**
```json
{ "url": "https://fal.media/..." }
```

**Errors:** `400` missing required field / missing fal key, `500` fal.ai failure.

> **Caveat:** `fal.config` is module-global. Under concurrent users with different keys there's a theoretical race. Acceptable for a portfolio demo; would need per-request client instantiation at scale.

---

## Image Serving

### GET /api/serve-image/[filename]

Serves JPEGs from `.cache/images/`. Filename must match `/^[\w-]+\.jpg$/`.

**Headers:** `Cache-Control: public, max-age=31536000` (1 year).

---

## PDF Extraction

### POST /api/extract-screenplay

Extracts structured JSON from a screenplay PDF via Claude Sonnet 4.6. **Currently disabled in the UI** (shown as "Soon") because Vercel's serverless timeout constraints can't reliably handle feature-length scripts — route works in isolation but times out behind the edge proxy. Kept in-tree for future re-enable.

**Request:** `multipart/form-data` with `file` (PDF) + `apiKey` (Claude key).

**Response:**
```json
{ "json": "{...screenplay...}", "tokens": { "input": 50000, "output": 28000 } }
```

**Errors:** `400` missing file/key, `413` output truncated (screenplay too long for one pass — `stop_reason === "max_tokens"`), `422` Claude returned invalid JSON, `500` extraction failed.

**Implementation notes:**
- `max_tokens: 32768`, `maxDuration: 300` (5 min)
- Uses `client.messages.stream().finalMessage()` to bypass the SDK's 10-minute non-streaming cap
- Three-stage JSON extractor: raw → fenced block → balanced-brace scan (recovers from preamble/trailing prose)
- Logs stop_reason, token usage, first/last 200 chars of response on failure

---

## Section Regeneration

### POST /api/regenerate-section

Hotswap a single markdown section without regenerating the full document.

**Request:**
```json
{ "sectionKey": "overview/taglines", "jsonData": "...", "apiKey": "sk-ant-..." }
```

**Supported keys:** `overview/taglines`, `mood-and-tone/color-palette`, `mood-and-tone/music`, `overview/synopsis`, `overview/themes`, `mood-and-tone/atmosphere`, `mood-and-tone/references`, `mood-and-tone/similar-moods`

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
{ "queries": [{ "title": "The Seventh Seal", "year": 1957 }], "apiKey": "tmdb-v3-key" }
```

**Response:**
```json
{ "films": [{ "query": "The Seventh Seal", "tmdb_id": 490, "title": "The Seventh Seal", "year": 1957, "poster_url": "https://image.tmdb.org/..." }] }
```

`apiKey` is optional — falls back to `TMDB_API_KEY` env var.

---

## SEO Routes

### GET /robots.txt
Auto-generated by `app/robots.ts`. Allows all user agents, disallows `/api/` + `/share`, points to sitemap.

### GET /sitemap.xml
Auto-generated by `app/sitemap.ts`. Lists `/`, `/demo`, `/demo/red-balloon`.

Both use `getSiteUrl()` from `lib/site-url.ts` to resolve the canonical base URL (NEXT_PUBLIC_SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → localhost).

---

## Access Gate

### POST /api/verify-access

Password gate used when `ACCESS_PASSWORD` env var is set on the server. Auto-skipped (returns 200) when unset — which is the case in the current public deployment.

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
