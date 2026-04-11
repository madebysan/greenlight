"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { PosterConceptsViewer } from "@/components/viewers/poster-concepts-viewer";
import { TitleTreatment } from "@/components/viewers/title-treatment";
import { SectionHead } from "@/components/ui/section-head";
import { replaceMarkdownSection } from "@/lib/markdown-utils";
import type { SavedImage } from "@/lib/reports";

type ColorEntry = { name: string; hex: string; description: string };

type KeyArtViewerProps = {
  jsonData: string;
  moodContent: string | null;
  onMoodContentUpdate?: (newContent: string) => void;
  posterContent: string | null;
  posterImages: Record<number, SavedImage>;
  onPosterImagesChange: (images: Record<number, SavedImage>) => void;
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

type SubTab = "identity" | "posters";

export function KeyArtViewer({
  jsonData,
  moodContent,
  onMoodContentUpdate,
  posterContent,
  posterImages,
  onPosterImagesChange,
}: KeyArtViewerProps) {
  const [tab, setTab] = useState<SubTab>("identity");
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
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Key Art</h1>
        <p className="text-[13px] text-muted-foreground">
          The film&apos;s visual identity — palette, title treatment, and poster concepts.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-border mb-6">
        <SubTabButton active={tab === "identity"} onClick={() => setTab("identity")}>
          Identity
        </SubTabButton>
        <SubTabButton active={tab === "posters"} onClick={() => setTab("posters")}>
          Posters
        </SubTabButton>
      </div>

      {tab === "identity" && (
        <div className="space-y-12">
          <section>
            <SectionHead
              index={1}
              meta={
                onMoodContentUpdate ? (
                  <button
                    onClick={handleReshufflePalette}
                    disabled={reshufflingPalette}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
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
              <p className="text-[13px] text-muted-foreground py-4">
                No palette generated yet. Check the Mood & Tone document.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {palette.map((c) => (
                  <div
                    key={c.hex}
                    className="flex items-start gap-3 rounded-[10px] border border-border/60 hover:border-border bg-card/30 px-3 py-3 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-md border border-border/60 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-foreground leading-tight">
                          {c.name}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                          {c.hex}
                        </span>
                      </div>
                      <p className="text-[12px] text-foreground/70 leading-[1.55] mt-1 line-clamp-2">
                        {c.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHead index={2}>Title Treatment</SectionHead>
            <TitleTreatment title={title} />
          </section>
        </div>
      )}

      {tab === "posters" && posterContent && (
        <PosterConceptsViewer
          content={posterContent}
          savedImages={posterImages}
          onImagesChange={onPosterImagesChange}
        />
      )}
      {tab === "posters" && !posterContent && (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Poster concepts haven&apos;t been generated yet.
        </p>
      )}
    </div>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
