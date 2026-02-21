import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";
import { STORYBOARD_PROMPTS_PROMPT } from "@/lib/prompts/storyboard-prompts";

export async function POST(request: NextRequest) {
  try {
    const { jsonData } = await request.json();

    if (!jsonData) {
      return NextResponse.json(
        { error: "Missing jsonData in request body" },
        { status: 400 }
      );
    }

    const markdown = await generateDocument(STORYBOARD_PROMPTS_PROMPT, jsonData);

    return NextResponse.json({ content: markdown });
  } catch (error) {
    console.error("Storyboard prompts generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
