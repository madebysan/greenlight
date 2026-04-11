"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Loader2, Palette, Type } from "lucide-react";
import { TitleTreatment } from "@/components/viewers/title-treatment";
import { SectionHead } from "@/components/ui/section-head";
import { SectionLabelPill } from "@/components/ui/inline-chip";
import { replaceMarkdownSection } from "@/lib/markdown-utils";

type ColorEntry = { name: string; hex: string; description: string };

type IdentityViewerProps = {
  jsonData: string;
  moodContent: string | null;
  onMoodContentUpdate?: (newContent: string) => void;
};

function parsePalette(md: string | null): ColorEntry[] {
  if (!md) return [];
  const sections = md.split(/^## /m).slice(1);
  for (const section of sections) {
    const [heading, ...bodyLines] = section.split("\n");
    if (!heading.toLowerCase().includes("color palette")) continue;
    const body = bodyLines.join("\n");
    const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
    const out: ColorEntry[] = [];
    for (const line of lines) {
      const match = line.match(/-\s*\*\*([^*]+)\*\*\s*`(#[0-9a-fA-F]{3,8})`\s*—\s*(.+)/);
      if (match) {
        out.push({
          name: match[1].trim(),
          hex: match[2].trim(),
          description: match[3].trim(),
        });
      }
    }
    return out;
  }
  return [];
}

function parseTitleFromJson(jsonData: string): string {
  try {
    const parsed = JSON.parse(jsonData);
    return parsed.title || "Untitled";
  } catch {
    return "Untitled";
  }
}

export function IdentityViewer({
  jsonData,
  moodContent,
  onMoodContentUpdate,
}: IdentityViewerProps) {
  const [reshufflingPalette, setReshufflingPalette] = useState(false);

  const palette = useMemo(() => parsePalette(moodContent), [moodContent]);
  const title = useMemo(() => parseTitleFromJson(jsonData), [jsonData]);

  const handleReshufflePalette = async () => {
    if (!moodContent || !onMoodContentUpdate) return;
    setReshufflingPalette(true);
    try {
      const res = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey: "mood-and-tone/color-palette", jsonData }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { content: newSection } = await res.json();
      const updated = replaceMarkdownSection(moodContent, "Color Palette", newSection);
      onMoodContentUpdate(updated);
    } catch (e) {
      console.error("Palette reshuffle failed", e);
    } finally {
      setReshufflingPalette(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <SectionLabelPill icon={<Palette size={10} />} className="mb-3">
          Visual Identity
        </SectionLabelPill>
        <h1 className="text-[32px] font-light tracking-[-0.025em] leading-[1.05] mb-2 text-foreground">
          Identity
        </h1>
        <p className="text-[13px] text-foreground/60 tracking-tight max-w-[58ch]">
          The film&apos;s brand language — color palette and title treatment. The
          foundation every other design decision builds on.
        </p>
      </div>

      <div className="space-y-14">
        <section>
          <SectionHead
            index={1}
            label="Palette"
            labelIcon={<Palette size={10} />}
            meta={
              onMoodContentUpdate ? (
                <button
                  onClick={handleReshufflePalette}
                  disabled={reshufflingPalette}
                  className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                  title="Reshuffle color palette"
                >
                  {reshufflingPalette ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <RefreshCw size={11} />
                  )}
                  Reshuffle
                </button>
              ) : null
            }
          >
            Color Palette
          </SectionHead>

          {palette.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 tracking-tight">
              No palette generated yet. Check the Mood & Tone document.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {palette.map((c) => (
                <div
                  key={c.hex}
                  className="flex items-start gap-3 rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover px-3 py-3 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-[6px] shrink-0 shadow-pill"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-foreground leading-tight tracking-tight">
                        {c.name}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
                        {c.hex}
                      </span>
                    </div>
                    <p className="text-[12px] text-foreground/70 leading-[1.55] mt-1 line-clamp-2 tracking-tight">
                      {c.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHead index={2} label="Treatment" labelIcon={<Type size={10} />}>
            Title Treatment
          </SectionHead>
          <TitleTreatment title={title} />
        </section>
      </div>
    </div>
  );
}
