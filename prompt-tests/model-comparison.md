# Greenlight Model Comparison

This compares the first DeepSeek role-pass run against the Codex CLI role-pass run for the EEAAO prompt experiment.

## Runs

| Model path | Run | Comparison |
|---|---|---|
| DeepSeek | `2026-05-14T14-58-55-442Z` | [comparison](runs/2026-05-14T14-58-55-442Z/comparison.md) |
| Codex CLI | `2026-05-14T15-12-11-062Z` | [comparison](runs/2026-05-14T15-12-11-062Z/comparison.md) |

## Quick Read

Codex is the better baseline for judging the direction. It is more restrained, more skeptical in the scorecard, and better at naming the main implementation risk: the role-pass reports are stronger, but many need compression before they belong in the app.

DeepSeek is useful as a cheap first pass. It generated plausible role reports and mostly found the same broad signal: role prompts improve Overview, Locations, Cast & Crew, Production Design, Title & Palette, and Poster Concepts. But it was more credulous in review language and more likely to call something “masterclass” without enough resistance.

## Output Shape

| Measure | DeepSeek | Codex CLI |
|---|---:|---:|
| After report word count | 15,719 | 13,621 |
| Creative Director words | 542 | 469 |
| Mood & Tone words | 1,911 | 1,258 |
| Production Design words | 3,043 | 2,035 |
| Poster Concepts words | 2,810 | 2,516 |

Codex gave shorter outputs without becoming thin. That matters because the role-pass idea can easily become too dense for a demo UI.

## Verdict Differences

- **DeepSeek:** role-pass wins 6 of 7 tabs, with current Mood & Tone winning.
- **Codex:** role-pass wins all 7 tabs, but with repeated warnings that the winning outputs need tightening.
- **Shared signal:** role prompts work best for department-specific tabs, especially Locations, Cast & Crew, Production Design, Title & Palette, and Poster Concepts.
- **Important disagreement:** DeepSeek preferred the current Mood & Tone because it felt less technical. Codex preferred the role-pass Mood & Tone because it translated mood into visual grammar while preserving atmosphere.

## Quality Notes

- **DeepSeek comparison weakness:** The scorecard occasionally overstates quality and uses promotional language. It also flagged “Becky” as a hallucination in Mood & Tone even though Becky exists in the EEAAO JSON, which weakens trust in its reviewer pass.
- **Codex comparison strength:** The scorecard repeatedly separates “stronger content” from “ready for UI,” which is the right product judgment. It catches density, scanability, and hallucination risk without dismissing the role-pass direction.
- **Codex output strength:** The Codex Mood & Tone pass is a good example of the target: concrete, scene-grounded, and still readable. It names light rules, camera distance, texture, sound, and avoidances without feeling like a camera manual.
- **Codex output risk:** It still produces long, authoritative reports. Any app integration should compress the content and design it into cards, callouts, and collapsible sections.

## Humanizer Status

The first DeepSeek run did **not** apply a separate humanizer pass. It only used grounding and anti-generic-writing instructions inside the role prompts.

The harness now supports a final editor pass with `GREENLIGHT_HUMANIZER_PASS=1`. That pass preserves facts and structure while removing AI tells: inflated significance language, “serves as,” “testament,” generic film adjectives, fake profundity, and repetitive list rhythm.

Recommended use:

- Use **Codex without humanizer** for the main quality baseline.
- Use **humanizer/editor pass** only after the role content is good, as a finishing pass.
- Do not use humanizer to rescue weak content. If the role pass is generic, regenerate the role pass instead.

## Recommendation

Use the Codex run as the source of truth for whether the direction is worth integrating. The direction is validated, but the app version should not simply dump these markdown reports into tabs. The next iteration should convert the winning role outputs into tighter tab structures with stronger hierarchy and fewer paragraphs.
