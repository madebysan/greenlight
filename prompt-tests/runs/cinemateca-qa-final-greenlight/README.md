# Greenlight Cinemateca-Aligned Visual QA

Date: 2026-05-14
Route: `http://localhost:3000/demo`
Viewport: `1399x1249`

## Screenshots

- `overview.png`
- `mood-and-tone.png`
- `scenes.png`
- `locations.png`
- `cast-and-crew.png`
- `production.png`
- `identity.png`
- `posters.png`

## Result

The final pass removes the cramped top-tab report shell and replaces it with a vertical report rail. The active-lens sidebar card is gone, the sidebar intro is reduced, and each report tab now gets a wider reading lane.

Key fixes verified in screenshots:

- Locations scout read is full-width and readable.
- Mood reference and similar-film cards stack one per row.
- Poster and soundtrack thumbnails keep fixed aspect ratios.
- Role metadata moved into report headers instead of repeating in the sidebar.
- Title treatment now uses a curated font pool instead of arbitrary novelty fonts.
- No horizontal overflow was detected on any tab.

## Verification

- `npm run lint` exits with 0 errors and existing warnings.
- `npm run build` completes successfully.
- Playwright screenshots captured all 8 tabs with no console/page errors.

