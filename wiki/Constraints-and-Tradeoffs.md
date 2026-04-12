# Constraints and Tradeoffs

## Intentional Tradeoffs

| Choice | What it enables | What it costs |
|--------|----------------|---------------|
| localStorage only | Zero deployment complexity, no auth | No cross-device sync, data lost on browser clear |
| Single project | Simple state, fast saves | Can't compare screenplays side-by-side |
| Happy path only | Less code, faster iteration | Errors may confuse users, no recovery flows |
| Markdown intermediate format | Human-readable, debuggable | Regex parsing is fragile, prompts and parsers are coupled |
| Props drilling (no context/store) | Explicit data flow, easy to trace | Deep callback chains through 3-4 component levels |
| Gesture Draw LoRA locked config | Consistent visual style | Users can't switch to other LoRAs or models from the UI |

## Known Limitations

1. **No persistence across browsers** — localStorage is browser-local. No export/import yet (backlogged).
2. **No collaborative editing** — single user, single browser tab.
3. **Silent error recovery** — Claude rate limits are retried 3x silently. If all retries fail, the user sees a generic error.
4. **TMDB lookups can fail** — if TMDB is down or the film title doesn't match, the Similar Moods section shows empty cards. No fallback UI.
5. **Image cache has no expiry** — `.cache/images/` grows forever. Manual cleanup required.
6. **No image optimization** — full JPEGs served directly. No WebP/AVIF conversion, no responsive sizes.
7. **fal.ai SDK type mismatch** — `negative_prompt` and `loras` parameters work but aren't in the TypeScript types. Requires `as never` assertion.
8. **Demo snapshot is static** — `lib/demo-project.ts` must be regenerated manually via the dev-only "Save as demo" menu item when content changes.

## Performance Characteristics

| Operation | Typical time | Bottleneck |
|-----------|-------------|-----------|
| 5 document generation (parallel) | 15-30s | Claude API latency |
| Single storyboard image | 5-15s | fal.ai LoRA loading (first call ~15s, subsequent ~5s) |
| Full image set (42 images, sequential) | 3-5 minutes | fal.ai rate + LoRA loading |
| TMDB poster lookup (batch) | 1-3s | TMDB API |
| localStorage save | <10ms | Synchronous JSON.stringify |
| Page navigation (tab switch) | <50ms | React re-render with parsed data |

## Security Considerations

- **API keys in browser** — keys entered in Settings are stored in plain localStorage. Acceptable for a portfolio demo but not for a production deployment.
- **No input sanitization on markdown** — Claude output is rendered via `react-markdown` with `remark-gfm`, which handles XSS. But prompt injection through screenplay JSON is theoretically possible.
- **Image filenames sanitized** — `serve-image` route validates filename against `/^[\w-]+\.jpg$/` to prevent path traversal.
- **No rate limiting on API routes** — any caller can hit the image/doc generation endpoints. Acceptable for local dev; would need middleware for public deployment.
