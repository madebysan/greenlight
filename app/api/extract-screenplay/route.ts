import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { STAGE_0_PROMPT } from "@/lib/prompts/stage-0";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clientKey = formData.get("apiKey") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No API key configured" }, { status: 400 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16384,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: STAGE_0_PROMPT,
            },
          ],
        },
      ],
    });

    const output = message.content[0]?.type === "text" ? message.content[0].text : "";

    // Extract JSON (may be wrapped in ```json ... ```)
    let json = output;
    const jsonMatch = output.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) json = jsonMatch[1].trim();

    // Validate it parses
    try {
      JSON.parse(json);
    } catch {
      return NextResponse.json(
        { error: "Claude returned invalid JSON. Try again or use the manual Gemini method." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      json,
      tokens: {
        input: message.usage?.input_tokens,
        output: message.usage?.output_tokens,
      },
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
