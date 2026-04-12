import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  DEFAULT_IMAGE_PROMPTS,
  IMAGE_NEGATIVE_PROMPT,
  GESTURE_DRAW_LORA_URL,
  GESTURE_DRAW_LORA_SCALE,
} from "@/lib/image-prompts";

fal.config({ credentials: process.env.FAL_KEY });

const IMAGES_DIR = join(process.cwd(), ".cache", "images");

export async function POST(request: NextRequest) {
  try {
    const { description, name, stylePrefix } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: "Missing description" },
        { status: 400 }
      );
    }

    const STYLE_PREFIX =
      typeof stylePrefix === "string" && stylePrefix.trim()
        ? stylePrefix.trim()
        : DEFAULT_IMAGE_PROMPTS.portrait;

    const prompt = `${STYLE_PREFIX}. Character: ${name || "Unknown"}. ${description}`;

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt,
        negative_prompt: IMAGE_NEGATIVE_PROMPT,
        loras: [{ path: GESTURE_DRAW_LORA_URL, scale: GESTURE_DRAW_LORA_SCALE }],
        image_size: { width: 720, height: 720 },
        num_images: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      } as never,
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image returned from fal.ai");
    }

    const res = await fetch(imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    const id = randomUUID().slice(0, 12);
    const filename = `portrait-${id}.jpg`;
    mkdirSync(IMAGES_DIR, { recursive: true });
    writeFileSync(join(IMAGES_DIR, filename), buffer);

    return NextResponse.json({ url: `/api/serve-image/${filename}` });
  } catch (error) {
    console.error("Portrait generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Portrait generation failed" },
      { status: 500 }
    );
  }
}
