import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";
import { MOOD_AND_TONE_PROMPT } from "@/lib/prompts/mood-and-tone";
import { trimForMoodAndTone } from "@/lib/json-trimmer";
import { getCached, setCache } from "@/lib/response-cache";

const SLUG = "mood-and-tone";

export async function POST(request: NextRequest) {
  try {
    const { jsonData, apiKey: clientKey } = await request.json();
    const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;

    if (!jsonData || !apiKey) {
      return NextResponse.json(
        { error: "Missing jsonData or apiKey" },
        { status: 400 }
      );
    }

    const cached = getCached(SLUG, jsonData);
    if (cached) {
      return NextResponse.json({ content: cached });
    }

    const trimmed = trimForMoodAndTone(jsonData);
    const markdown = await generateDocument(MOOD_AND_TONE_PROMPT, trimmed, apiKey);
    setCache(SLUG, jsonData, markdown);

    return NextResponse.json({ content: markdown });
  } catch (error) {
    console.error("Mood and tone generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
