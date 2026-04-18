import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import {
  DEFAULT_IMAGE_PROMPTS,
  IMAGE_NEGATIVE_PROMPT,
  GESTURE_DRAW_LORA_URL,
  GESTURE_DRAW_LORA_SCALE,
} from "@/lib/image-prompts";

export async function POST(request: NextRequest) {
  try {
    const { prompt, stylePrefix, apiKey: clientKey } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const credentials = clientKey || process.env.FAL_KEY;
    if (!credentials) {
      return NextResponse.json({ error: "Missing fal.ai API key" }, { status: 400 });
    }
    // fal.config is module-global; for a portfolio demo with modest concurrency
    // that's acceptable. Under heavy mixed-user traffic we'd want per-call creds.
    fal.config({ credentials });

    const STYLE_PREFIX =
      typeof stylePrefix === "string" && stylePrefix.trim()
        ? stylePrefix.trim()
        : DEFAULT_IMAGE_PROMPTS.storyboard;

    const storyboardPrompt = [STYLE_PREFIX, prompt].join(". ");

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt: storyboardPrompt,
        negative_prompt: IMAGE_NEGATIVE_PROMPT,
        loras: [{ path: GESTURE_DRAW_LORA_URL, scale: GESTURE_DRAW_LORA_SCALE }],
        image_size: { width: 1280, height: 720 },
        num_images: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        acceleration: "regular",
      } as never,
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image returned from fal.ai");
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
