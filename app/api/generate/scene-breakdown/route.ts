import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";
import { SCENE_BREAKDOWN_PROMPT } from "@/lib/prompts/scene-breakdown";
import { trimForSceneBreakdown } from "@/lib/json-trimmer";
import { getCached, setCache } from "@/lib/response-cache";

const SLUG = "scene-breakdown";

export async function POST(request: NextRequest) {
  try {
    const { jsonData, apiKey } = await request.json();

    if (!jsonData || !apiKey) {
      return NextResponse.json(
        { error: "Missing jsonData or apiKey in request body" },
        { status: 400 }
      );
    }

    // Return cached response if available (keyed by slug + input hash)
    const cached = getCached(SLUG, jsonData);
    if (cached) {
      return NextResponse.json({ content: cached });
    }

    const trimmed = trimForSceneBreakdown(jsonData);
    const markdown = await generateDocument(SCENE_BREAKDOWN_PROMPT, trimmed, apiKey);
    setCache(SLUG, jsonData, markdown);

    return NextResponse.json({ content: markdown });
  } catch (error) {
    console.error("Scene breakdown generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
