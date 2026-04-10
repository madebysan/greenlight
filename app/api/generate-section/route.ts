import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";

const SECTION_PROMPTS: Record<string, string> = {
  "festival-strategy": `Based on the screenplay data provided, write a Festival Strategy section for the marketing brief.
Include: recommended festivals (Sundance, TIFF, Cannes, SXSW, genre-specific fests) with rationale for each,
premiere tier strategy (world premiere vs regional), submission timeline, and which aspects of the film
make it a strong festival candidate. Format as markdown with ## Festival Strategy header.`,

  "distribution": `Based on the screenplay data provided, write a Distribution Positioning section for the marketing brief.
Include: recommended distribution model (theatrical vs streaming vs hybrid), comparable deal comps from similar films,
which distributors/buyers would be most interested and why, territory-by-territory considerations,
and estimated market positioning. Format as markdown with ## Distribution Positioning header.`,

  "pitch-deck": `Based on the screenplay data provided, write a Pitch Deck Elements section for the marketing brief.
Include: one-liner (1 sentence), elevator pitch (30 second version), full pitch (2 minute version),
key selling points for investors/producers, and unique value propositions that differentiate this project.
Format as markdown with ## Pitch Deck Elements header.`,

  "social-hooks": `Based on the screenplay data provided, write a Social Media Hooks section for the marketing brief.
Include: moments/themes that would trend on social media, fan community angles, viral potential,
recommended platforms and content types, hashtag suggestions, and content calendar ideas for pre-release buzz.
Format as markdown with ## Social Media Hooks header.`,

  "casting-wishlist": `Based on the screenplay data provided, write a Casting Wishlist section for the marketing brief.
For each major character, suggest 3-4 actors who would be ideal based on the character description, age range,
physical requirements, and the tone of comparable films. Include brief rationale for each suggestion.
Format as markdown with ## Casting Wishlist header.`,

  "music-direction": `Based on the screenplay data provided, write a Music & Soundtrack Direction section for the marketing brief.
Include: overall sonic palette and mood, temp track suggestions (specific songs/composers), composer style references,
key emotional cues mapped to major scenes, and any diegetic music mentioned in the script.
Format as markdown with ## Music & Soundtrack Direction header.`,
};

export async function POST(request: NextRequest) {
  try {
    const { sectionType, jsonData, apiKey: clientKey } = await request.json();
    const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;

    if (!sectionType || !jsonData || !apiKey) {
      return NextResponse.json(
        { error: "Missing sectionType, jsonData, or apiKey" },
        { status: 400 }
      );
    }

    const prompt = SECTION_PROMPTS[sectionType];
    if (!prompt) {
      return NextResponse.json(
        { error: `Unknown section type: ${sectionType}` },
        { status: 400 }
      );
    }

    const content = await generateDocument(prompt, jsonData, apiKey);
    return NextResponse.json({ content: content.trim() });
  } catch (error) {
    console.error("Section generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
