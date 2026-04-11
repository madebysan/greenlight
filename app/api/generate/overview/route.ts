import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";
import { OVERVIEW_PROMPT } from "@/lib/prompts/overview";
import { trimForOverview } from "@/lib/json-trimmer";
import { getCached, setCache } from "@/lib/response-cache";

const SLUG = "overview";

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

    const trimmed = trimForOverview(jsonData);
    const markdown = await generateDocument(OVERVIEW_PROMPT, trimmed, apiKey);
    setCache(SLUG, jsonData, markdown);

    return NextResponse.json({ content: markdown });
  } catch (error) {
    console.error("Overview generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
