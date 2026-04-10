import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";

const SYSTEM_PROMPT = `You are a storyboard artist reimagining a scene for a film.
Given an existing storyboard prompt, write a DIFFERENT visual interpretation of the same scene.
Change the camera angle, framing, focal point, or composition — but keep the same narrative beat.
Output ONLY the new prompt text, nothing else. No labels, no explanation. 1-3 sentences max.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, slugLine, apiKey: clientKey } = await request.json();
    const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;

    if (!prompt || !apiKey) {
      return NextResponse.json(
        { error: "Missing prompt or apiKey" },
        { status: 400 }
      );
    }

    const input = `Scene: ${slugLine || "Unknown"}\n\nCurrent prompt:\n${prompt}\n\nWrite a different visual interpretation of this same scene.`;
    const newPrompt = await generateDocument(SYSTEM_PROMPT, input, apiKey);

    return NextResponse.json({ prompt: newPrompt.trim() });
  } catch (error) {
    console.error("Prompt regeneration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
