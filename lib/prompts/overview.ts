export const OVERVIEW_PROMPT = `Generate an Overview document from this screenplay data. This is the first thing a collaborator opens — it should read like the opening page of a 1st AD's first-pass breakdown. Treat it as a pitch artifact, not a spreadsheet.

Format your output as clean markdown:

# [Title]

## Logline
Write a single compelling sentence (maximum 30 words) that captures the protagonist, their goal, the obstacle, and the stakes. This is what goes on the one-sheet.

## Taglines
Write 3 taglines for the film. Taglines are what goes on the poster — short, atmospheric, built for a one-sheet. Each should take a different angle: one visceral, one thematic, one enigmatic. No more than 10 words each. No cliches. Format as a plain list:

- Tagline one
- Tagline two
- Tagline three

## Synopsis
Write a 150-200 word spoiler-free synopsis. Establish the world, the characters, and the conflict — tease the turn without revealing the ending. Suitable for sharing with a potential DP, production designer, or investor who hasn't read the script.

## Film Identity
Always render in this exact order. Include **Written by** whenever the \`writer\` field in the JSON is a non-empty string. Only include **Based on** when the \`based_on\` field is a non-empty string.
- **Written by:** [writer field, verbatim]
- **Based on:** [based_on field, verbatim — omit this bullet entirely if the JSON has no based_on or it's empty]
- **Genre:** [primary + secondary]
- **Format:** [feature, short, series, commercial — infer from total_pages]
- **Setting:** [setting_period]
- **Tone:** [tone from the JSON]
- **Runtime estimate:** [rough estimate from page count at 1 page/minute]

## Themes
Render each theme from the JSON as a concise heading + 1-2 sentence explanation of how it threads through the story. Be specific — reference actual scenes or character arcs where helpful.

## Scope at a Glance
A quick read on the size of the project. Use concrete numbers pulled from the JSON:
- **Total scenes:** [count]
- **Unique locations:** [count]
- **Principal cast:** [count of characters]
- **Exterior scenes:** [count]
- **Night shoots:** [count with time_of_day = NIGHT]
- **VFX / practical-effects scenes:** [count of scenes with non-empty vfx_stunts]
- **Complexity read:** [one sentence qualitative judgment — "contained single-location thriller with a small cast" / "ambitious period piece with extensive night shoots" etc.]

Output ONLY the markdown document. No commentary outside the document. Do not include any introductory text before the # heading.`;
