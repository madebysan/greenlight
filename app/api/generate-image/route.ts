import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import {
  DEFAULT_IMAGE_PROMPTS,
  IMAGE_NEGATIVE_PROMPT,
  GESTURE_DRAW_LORA_URL,
  GESTURE_DRAW_LORA_SCALE,
} from "@/lib/image-prompts";

fal.config({ credentials: process.env.FAL_KEY });

export async function POST(request: NextRequest) {
  try {
    const { prompt, camera, stylePrefix } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

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
