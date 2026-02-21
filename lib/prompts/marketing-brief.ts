export const MARKETING_BRIEF_PROMPT = `Generate a Marketing Brief document from this screenplay data. This is a creative marketing document, not a production document.

Format your output as clean markdown:

# Marketing Brief: [Title]

## Film Identity
- **Title:** [title]
- **Genre:** [genres]
- **Tone:** [tone]
- **Setting:** [setting period]

## Logline
Write a compelling 1-2 sentence logline that would appear on a movie poster or streaming platform.

## Synopsis (Spoiler-Free)
Write a 150-200 word synopsis suitable for press releases, festival submissions, or streaming descriptions. NO spoilers — tease the conflict without revealing the resolution.

## Full Plot Summary
Write a detailed 400-600 word plot summary including all major plot points and the ending. This is for internal use (investors, distributors).

## Taglines
Generate 5 distinct tagline options, each with a different angle:
1. **Emotional:** [tagline focused on feeling]
2. **Mystery/Hook:** [tagline that asks a question or creates intrigue]
3. **Character:** [tagline from the protagonist's perspective]
4. **Thematic:** [tagline that captures the theme]
5. **Minimal:** [short, punchy, 3-5 words]

## Comparable Films
For each comp (3-5 films), explain:
- **[Film Title] ([Year])** — [1-2 sentences on why it's comparable: similar tone, audience, theme, or visual style]

## Visual Direction
### Color Palette
Suggest 5 colors that define the film's visual identity. For each:
- **[Color Name]** — #[hex code] — [why this color: mood, scene association, character association]

### Mood & Atmosphere
Describe the overall visual mood in 2-3 sentences. Reference specific scenes that exemplify it.

### Typography Direction
Suggest a typography style for marketing materials:
- **Title treatment:** [description — serif, sans-serif, handwritten, etc. and why]
- **Body copy:** [suggestion]
- **Reference:** [a real font name or style that captures the feel]

## Target Audience
### Primary Audience
- **Demographics:** [age range, interests]
- **Psychographics:** [what they value, what they're looking for]
- **Where to reach them:** [platforms, festivals, communities]

### Secondary Audience
- **Demographics:** [broader audience]
- **Hook:** [what draws them in despite not being the primary target]

Output ONLY the markdown document. No commentary outside the document.`;
