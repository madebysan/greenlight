import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";
import { STORYBOARD_PROMPTS_PROMPT } from "@/lib/prompts/storyboard-prompts";
import { trimForStoryboardPrompts } from "@/lib/json-trimmer";
import { getCached, setCache } from "@/lib/response-cache";

const SLUG = "storyboard-prompts";

export async function POST(request: NextRequest) {
  try {
    const { jsonData } = await request.json();

    if (!jsonData) {
      return NextResponse.json(
        { error: "Missing jsonData in request body" },
        { status: 400 }
      );
    }

    const cached = getCached(SLUG, jsonData);
    if (cached) {
      return NextResponse.json({ content: cached });
    }

    const trimmed = trimForStoryboardPrompts(jsonData);
    const markdown = await generateDocument(STORYBOARD_PROMPTS_PROMPT, trimmed);
    setCache(SLUG, jsonData, markdown);

    return NextResponse.json({ content: markdown });
  } catch (error) {
    console.error("Storyboard prompts generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
