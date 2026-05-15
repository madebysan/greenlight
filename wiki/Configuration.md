# Configuration

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `lib/text-generation.ts` | Server fallback for Claude |
| `OPENAI_API_KEY` | `lib/text-generation.ts` | Server fallback for OpenAI |
| `DEEPSEEK_API_KEY` | `lib/text-generation.ts` | Server fallback for DeepSeek |
| `GEMINI_API_KEY` | `lib/text-generation.ts` | Server fallback for Gemini |
| `FAL_KEY` | `lib/fal-client.ts` | Server fallback for fal.ai |
| `TMDB_API_KEY` | `app/api/tmdb-search/route.ts` | Server fallback for TMDB |
| `ACCESS_PASSWORD` | `components/password-gate.tsx`, `/api/verify-access` | Optional session password gate |
| `NEXT_PUBLIC_SITE_URL` | `lib/site-url.ts` | Canonical URL metadata |
| `GREENLIGHT_TEXT_PROVIDER` | `prompt-tests/scripts/build-demo-fixture.mjs` | Local fixture generation mode |
| `GREENLIGHT_IMAGE_CONCURRENCY` | `prompt-tests/scripts/build-demo-fixture.mjs` | Fixture image concurrency |
| `GREENLIGHT_PROMPT_PROVIDER` | `prompt-tests/scripts/compare-role-passes.mjs` | Prompt comparison provider |
| `GREENLIGHT_PROMPT_MODEL` | `prompt-tests/scripts/compare-role-passes.mjs` | Prompt comparison model override |
| `GREENLIGHT_HUMANIZER_PASS` | `prompt-tests/scripts/compare-role-passes.mjs` | Optional comparison pass |

## Browser Storage

| Key | Meaning |
|---|---|
| `greenlight-project` | The one active `SavedProject` |
| `stp-api-key` | Selected text provider key |
| `stp-api-provider` | Selected text provider id |
| `stp-fal-key` | fal.ai key |
| `stp-tmdb-key` | TMDB key |
| `greenlight-image-prompts` | User image-prompt overrides |

## Next Config

`next.config.ts` adds baseline production security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.

## API Key Policy

The release architecture is bring-your-own-keys. The browser stores keys in localStorage, then sends the relevant key to a route handler only when generation is requested. Server env vars are fallbacks for local/private setups, not public product storage.

