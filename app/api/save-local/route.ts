import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { filename, content } = await req.json();

    if (!filename || !content) {
      return NextResponse.json({ error: "Missing filename or content" }, { status: 400 });
    }

    // Sanitize filename to prevent path traversal
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    const dir = join(homedir(), "Desktop", "script-to-production");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, safeName), content, "utf-8");

    return NextResponse.json({ ok: true, path: join(dir, safeName) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save file" },
      { status: 500 }
    );
  }
}
