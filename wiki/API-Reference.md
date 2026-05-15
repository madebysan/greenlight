# API Reference

Greenlight's APIs are Next.js route handlers. They are internal product routes, not a public stable API.

## Text Generation

### `POST /api/generate/overview`
### `POST /api/generate/mood-and-tone`
### `POST /api/generate/scene-breakdown`
### `POST /api/generate/storyboard-prompts`
### `POST /api/generate/poster-concepts`

Request body:

```json
{
  "jsonData": "{...screenplay json...}",
  "apiProvider": "anthropic",
  "apiKey": "provider key"
}
```

Response:

```json
{
  "content": "markdown document"
}
```

Each route trims the JSON differently with `lib/json-trimmer.ts`, then calls the selected text provider.

## Section Regeneration

### `POST /api/regenerate-section`

Request body:

```json
{
  "sectionKey": "mood-and-tone/color-palette",
  "jsonData": "{...screenplay json...}",
  "apiProvider": "anthropic",
  "apiKey": "provider key"
}
```

Returns a markdown section that the client can splice back into the full document with `replaceMarkdownSection`.

## Image Generation

### `POST /api/generate-image`
Storyboard frame generation.

### `POST /api/generate-portrait`
Character portrait generation.

### `POST /api/generate-prop`
Prop image generation.

### `POST /api/generate-poster-image`
Poster concept image generation.

Common request shape:

```json
{
  "prompt": "image prompt",
  "stylePrefix": "optional user override",
  "apiKey": "fal.ai key"
}
```

Response:

```json
{
  "url": "https://..."
}
```

## Utility Routes

| Route | Purpose |
|---|---|
| `POST /api/tmdb-search` | Batch lookup of film poster references |
| `POST /api/save-local` | Development-only markdown save path |
| `POST /api/save-demo` | Demo snapshot helper |
| `POST /api/save-cached` | Cached-project helper |
| `POST /api/verify-access` | Optional password gate |
| `POST /api/extract-screenplay` | PDF extraction backend, currently disabled in UI |
| `GET /api/serve-image/[filename]` | Serves generated local image files |

