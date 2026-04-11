import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";

// Focused prompts for regenerating individual sections within a document.
// Each returns JUST the section markdown (including the ## heading) so callers
// can splice it back into the full document.

const SECTION_PROMPTS: Record<string, string> = {
  "overview/taglines": `Write 3 new taglines for this film. Taglines are what goes on the poster — short, atmospheric, built for a one-sheet. Each should take a different angle: one visceral, one thematic, one enigmatic. No more than 10 words each. Avoid cliches and avoid repeating anything a previous generation might have written.

Output ONLY the taglines in this exact markdown format:

## Taglines
- Tagline one
- Tagline two
- Tagline three

No commentary, no extra text.`,

  "mood-and-tone/color-palette": `Propose 5 NEW colors that define this film's visual identity. Ground each choice in the screenplay — what scene, what character, what emotional beat does this color belong to? Pick colors that are DIFFERENT from an obvious first pass — reach for the second or third choice a designer would make. No obvious blacks/whites/reds unless there's a specific scene-grounded reason. Mix hue, saturation, and temperature intentionally.

Output ONLY the palette in this exact markdown format:

## Color Palette
- **[Color Name]** \`#[hex]\` — [one sentence tying this color to a specific scene or emotional register from the script]
- **[Color Name]** \`#[hex]\` — [description]
- **[Color Name]** \`#[hex]\` — [description]
- **[Color Name]** \`#[hex]\` — [description]
- **[Color Name]** \`#[hex]\` — [description]

No commentary, no extra text.`,

  "mood-and-tone/music": `Rewrite the Music & Sound Direction for this film. Write 2-3 paragraphs on the sonic texture — the musical identity (acoustic or electronic, sparse or dense, scored or found), and specific screenplay moments where music/sound should do heavy lifting. Reference scene numbers where relevant.

Then list 4 SOUNDTRACK REFERENCES — actual film scores. Use a DIFFERENT set of films from any obvious first pass. Mix canonical with recent, and include at least one slightly unexpected pick. Use exact common film titles so they can be looked up.

Output ONLY the section in this exact markdown format:

## Music & Sound Direction
[paragraph 1]

[paragraph 2]

[paragraph 3, optional]

### Soundtrack References
- **[Film Title] ([Year])** — [Composer] — [one sentence on what specifically to steal]
- **[Film Title] ([Year])** — [Composer] — [one sentence]
- **[Film Title] ([Year])** — [Composer] — [one sentence]
- **[Film Title] ([Year])** — [Composer] — [one sentence]

No commentary, no extra text.`,
};

export async function POST(request: NextRequest) {
  try {
    const { sectionKey, jsonData, apiKey: clientKey } = await request.json();
    const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;

    if (!sectionKey || !jsonData || !apiKey) {
      return NextResponse.json(
        { error: "Missing sectionKey, jsonData, or apiKey" },
        { status: 400 },
      );
    }

    const prompt = SECTION_PROMPTS[sectionKey];
    if (!prompt) {
      return NextResponse.json(
        { error: `Unknown section key: ${sectionKey}` },
        { status: 400 },
      );
    }

    const content = await generateDocument(prompt, jsonData, apiKey);
    return NextResponse.json({ content: content.trim() });
  } catch (error) {
    console.error("Section regeneration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Regeneration failed" },
      { status: 500 },
    );
  }
}
