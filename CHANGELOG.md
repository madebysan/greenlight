# Changelog

## Unreleased

- Added `Past Lives` as a new diasporic-romance demo deck with generated fixture data, images, route, share source, sitemap entry, and landing-card entry.
- Added `The Favourite` as a new period court-intrigue demo deck with generated fixture data, images, route, share source, sitemap entry, and landing-card entry.
- Added explicit demo image generation modes so fixture builds refuse stale image folders by default, with opt-in `--force-images` and `--reuse-images` flags.
- Added the `Dune: Part One` demo deck with a dedicated route, share source, OG image route, landing-card entry, generated report fixture, and 38 committed demo images.
- Improved the demo fixture builder so local fallback reports no longer reuse film-specific Get Out language for new example scripts.
- Removed stale generated docs from the public repo until they can be rebuilt from the current product.
- Stopped tracking local-only agent notes, component audit output, and generated prompt-test run artifacts.
- Kept reusable prompt-test scripts while ignoring generated comparison reports and screenshots.
- Added a managed `_archived/` ignore rule so local cleanup batches stay reviewable but never ship to GitHub.

## v0.2.0 - 2026-05-14

Private production checkpoint for the Greenlight report redesign and provider setup.

### Added

- Added a role-pass prompt comparison harness under `prompt-tests/`, including before/after report bundles, model comparison notes, token cost estimates, and visual QA artifacts.
- Added a vertical department report navigation model for the demo reports, with dedicated sections for Overview, Mood & Tone, Scenes, Locations, Cast & Crew, Production Design, Identity, and Poster Concepts.
- Added reusable report UI pieces for department lens metadata and previous/next section navigation.
- Added OpenAI, DeepSeek, and Gemini as selectable text provider options alongside Claude, with a single active provider at a time.
- Added shared text generation plumbing for Anthropic, OpenAI-compatible APIs, DeepSeek, and Gemini.
- Added demo OG image routes for the Night of the Living Dead and Red Balloon reports.
- Added a component inventory snapshot so future UI work has a starting point for cleanup.

### Changed

- Reworked the report UI to feel closer to Cinemateca: darker editorial surface, stronger type hierarchy, quieter chrome, richer cards, and more scan-friendly layouts.
- Moved the report tabs from a horizontal tab row into a left-side department rail.
- Updated report copy, settings copy, and onboarding copy to be more direct and less generic.
- Improved the share page for printing and PDF export by forcing it into a light presentation mode.
- Simplified the bottom section navigation so each CTA has a smaller sans-serif title, an arrow, and no extra subtitle.
- Removed oversized palette blocks in poster concepts. Compact swatches now carry the color values and can be copied individually.
- Updated docs and README language so the hosted deployment is not advertised from GitHub.
- Upgraded Next.js to `16.2.6`.

### Hardened

- Made `/api/save-local` dev-only so production cannot write generated report files to disk.
- Stopped the client from calling `/api/save-local` outside development.
- Added baseline production security headers in `next.config.ts`.
- Kept provider keys in browser storage for user-supplied keys, with server env vars used only as intentional fallbacks.
- Verified Vercel production env vars for Anthropic, fal.ai, and TMDB without printing secret values.
- Cleared the GitHub repo homepage field so the private Vercel deployment is not advertised from the public repo.

### Removed

- Removed dead UI components that were no longer used after the report redesign.
- Removed the old JSON input wizard step from the current flow.
- Removed stale public deployment links from README and wiki docs.

### Verification

- `npm run build` passed on Next.js `16.2.6`.
- `npm run lint` passed with two existing `@next/next/no-img-element` warnings.
- Production smoke checks passed for `/`, `/demo`, `/demo/red-balloon`, and `/share`.
- Production OG image routes returned `200 image/png`.
- Production TMDB lookup returned a real poster result.
- Production `/api/save-local` returned `403`, as intended.
- Security headers were present in production responses.
- GitHub README and repo metadata were checked for live deployment URLs.

### Notes

- `npm audit --omit=dev` still reports two moderate advisories through Next/PostCSS. There are no high or critical findings.
- The hosted deployment remains intentionally private because it may use personal provider keys.
