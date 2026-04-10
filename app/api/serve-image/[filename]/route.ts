import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const IMAGES_DIR = join(process.cwd(), ".cache", "images");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitize — only allow alphanumeric + dash + dot
    if (!/^[\w-]+\.jpg$/.test(filename)) {
      return new NextResponse("Not found", { status: 404 });
    }

    const buffer = readFileSync(join(IMAGES_DIR, filename));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
