# Greenlight Token Cost Estimate

Run used for after-output sizing: `2026-05-14T15-12-11-062Z`  
Project: Everything Everywhere All At Once

These are rough token estimates using `characters / 4`. Actual tokenizer counts vary by provider, but this is accurate enough for planning.

## Summary

| Path | Calls | Input tokens | Output tokens | Total tokens |
|---|---:|---:|---:|---:|
| Current app generation | 5 | 21,652 | 23,841 | 45,493 |
| Role-pass generation | 8 | 52,591 | 21,258 | 73,849 |
| Role-pass + comparison harness | 15 | 86,796 | 24,288 | 111,084 |

## Interpretation

- The current app path is cheapest because it generates 5 markdown docs and derives several tabs directly from JSON in the UI.
- The role-pass path is roughly **2.4x input tokens** and **0.9x output tokens** compared with current generation.
- The comparison harness is intentionally more expensive because it also asks the model to review before/after pairs. That review cost should not ship in the app.
- The app-integrated version should target the **Role-pass generation** row, not the comparison row.

## Current App Generation Detail

| Doc | Input tokens | Output tokens |
|---|---:|---:|
| Overview | 4,669 | 891 |
| Mood & Tone | 3,762 | 2,233 |
| Scene Breakdown | 5,992 | 5,056 |
| Storyboard Prompts | 4,272 | 7,938 |
| Poster Concepts | 2,957 | 7,723 |

## Role-Pass Generation Detail

| Pass | Input tokens | Output tokens |
|---|---:|---:|
| Creative Director | 8,171 | 695 |
| Overview | 8,866 | 1,760 |
| Mood & Tone | 4,126 | 1,873 |
| Locations | 5,898 | 4,945 |
| Cast & Crew | 5,257 | 2,846 |
| Production Design | 8,299 | 3,268 |
| Title & Palette | 5,987 | 1,885 |
| Poster Concepts | 5,987 | 3,986 |

## Cost-Control Notes

- Biggest input costs are the role passes that receive broad scene/location/prop context: Locations, Production Design, and the two Key Art passes.
- Biggest output costs are Locations and Poster Concepts.
- A production implementation should cap role output length and generate only the tabs the user opens, or run role passes in phases.
- A humanizer/editor pass would roughly add another read+rewrite of every after report. Budget it as about **+21,258 input tokens** and **+15,944 output tokens** if run on all role reports.
