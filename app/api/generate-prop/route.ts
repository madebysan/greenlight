import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { DEFAULT_IMAGE_PROMPTS, STYLE_OVERRIDE_PREFIX, STYLE_REINFORCEMENT } from "@/lib/image-prompts";

fal.config({ credentials: process.env.FAL_KEY });

const IMAGES_DIR = join(process.cwd(), ".cache", "images");

export async function POST(request: NextRequest) {
  try {
    const { name, notes, stylePrefix } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Missing prop name" }, { status: 400 });
    }

    const STYLE_PREFIX =
      typeof stylePrefix === "string" && stylePrefix.trim()
        ? stylePrefix.trim()
        : DEFAULT_IMAGE_PROMPTS.prop;

    const description = notes ? `${name}. ${notes}` : name;
    const prompt = [
      STYLE_PREFIX,
      STYLE_OVERRIDE_PREFIX,
      "Subject:",
      description,
      STYLE_REINFORCEMENT,
    ].join(" ");

    const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
      input: {
        prompt,
        aspect_ratio: "1:1",
        num_images: 1,
      },
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image returned from fal.ai");
    }

    const res = await fetch(imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    const id = randomUUID().slice(0, 12);
    const filename = `prop-${id}.jpg`;
    mkdirSync(IMAGES_DIR, { recursive: true });
    writeFileSync(join(IMAGES_DIR, filename), buffer);

    return NextResponse.json({ url: `/api/serve-image/${filename}` });
  } catch (error) {
    console.error("Prop generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prop generation failed" },
      { status: 500 },
    );
  }
}
