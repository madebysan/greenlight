# Troubleshooting

## Generation Does Not Start

Check that the selected text provider has a key in the API key modal. Cached demo titles can skip live generation, but new projects need a provider key.

## A Text Section Failed

The five text documents are generated independently. One section can fail while others finish. Check the visible failed-section message and the server console for provider errors.

## Images Do Not Generate

Fresh images require a fal.ai key. If the key exists and images still fail, check for quota or payment errors. The image queue treats credit/payment failures as a stop condition.

## Mood Reference Posters Are Missing

TMDB lookup is optional. Without a TMDB key or successful lookup, the mood references still render as text but may not show poster thumbnails.

## Demo Looks Like It Has Missing Images

Demo routes read committed paths under `public/demo-images`. Confirm the fixture image map points to a file that exists.

## Build Fails Because Of Prompt-Test Artifacts

Ignored prompt-test runs can contain TypeScript or JavaScript snapshots that tooling may scan if they are left with executable extensions. Rename archival snapshots to `.txt` or keep generated artifacts out of scanned paths.

## PDF Upload Confusion

`app/api/extract-screenplay/route.ts` exists, but the UI intentionally disables PDF upload because serverless timeouts made feature-length scripts unreliable.

