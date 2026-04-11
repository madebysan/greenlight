"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Loader2, FileText, Sparkles, BarChart3, Compass } from "lucide-react";
import { replaceMarkdownSection } from "@/lib/markdown-utils";
import { SectionHead } from "@/components/ui/section-head";
import { SectionLabelPill } from "@/components/ui/inline-chip";
import { PosterCarousel } from "./poster-carousel";
import type { SavedImage } from "@/lib/reports";

type IdentityEntry = { label: string; value: string };
type ThemeEntry = { title: string; body: string };
type StatEntry = { label: string; value: string };

type ParsedOverview = {
  title: string;
  logline: string;
  taglines: string[];
  synopsis: string;
  identity: IdentityEntry[];
  themes: ThemeEntry[];
  stats: StatEntry[];
  complexity: string;
};

export function parseOverview(md: string): ParsedOverview {
  const result: ParsedOverview = {
    title: "",
    logline: "",
    taglines: [],
    synopsis: "",
    identity: [],
    themes: [],
    stats: [],
    complexity: "",
  };

  const titleMatch = md.match(/^#\s+(.+)$/m);
  if (titleMatch) result.title = titleMatch[1].trim();

  const sections = md.split(/^## /m).slice(1);

  for (const section of sections) {
    const [heading, ...bodyLines] = section.split("\n");
    const body = bodyLines.join("\n").trim();
    const h = heading.toLowerCase().trim();

    if (h === "logline") {
      result.logline = body.trim();
    } else if (h === "taglines" || h.includes("tagline")) {
      const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
      result.taglines = lines.map((l) => l.replace(/^-\s*/, "").trim()).filter(Boolean);
    } else if (h === "synopsis") {
      result.synopsis = body.trim();
    } else if (h.includes("film identity")) {
      const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
      for (const line of lines) {
        const match = line.match(/-\s*\*\*([^:]+):\*\*\s*(.+)/);
        if (match) {
          result.identity.push({ label: match[1].trim(), value: match[2].trim() });
        }
      }
    } else if (h === "themes") {
      const blocks = body.split(/\n\n+/).filter(Boolean);
      for (const block of blocks) {
        const match = block.match(/^\*\*([^*]+)\*\*\s*\n?([\s\S]*)/);
        if (match) {
          result.themes.push({
            title: match[1].trim(),
            body: match[2].trim(),
          });
        }
      }
    } else if (h.includes("scope")) {
      const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
      for (const line of lines) {
        const match = line.match(/-\s*\*\*([^:]+):\*\*\s*(.+)/);
        if (match) {
          const label = match[1].trim();
          const value = match[2].trim();
          if (label.toLowerCase().includes("complexity")) {
            result.complexity = value;
          } else {
            result.stats.push({ label, value });
          }
        }
      }
    }
  }

  return result;
}

type OverviewViewerProps = {
  content: string;
  jsonData?: string;
  onContentUpdate?: (newContent: string) => void;
  posterContent?: string | null;
  posterImages?: Record<number, SavedImage>;
};

export function OverviewViewer({
  content,
  jsonData,
  onContentUpdate,
  posterContent,
  posterImages,
}: OverviewViewerProps) {
  const parsed = useMemo(() => parseOverview(content), [content]);
  const [refreshingTaglines, setRefreshingTaglines] = useState(false);

  const handleRefreshTaglines = async () => {
    if (!jsonData || !onContentUpdate) return;
    setRefreshingTaglines(true);
    try {
      const res = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey: "overview/taglines", jsonData }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { content: newSection } = await res.json();
      const updated = replaceMarkdownSection(content, "Taglines", newSection);
      onContentUpdate(updated);
    } catch (e) {
      console.error("Tagline refresh failed", e);
    } finally {
      setRefreshingTaglines(false);
    }
  };

  const hasCarousel = !!posterContent && !!posterImages && Object.keys(posterImages).length > 0;

  return (
    <div className="max-w-5xl space-y-16">
      <header className={hasCarousel ? "grid grid-cols-1 md:grid-cols-[1fr_240px] gap-10 items-start" : ""}>
        <div>
          <SectionLabelPill icon={<Compass size={10} />} className="mb-4">
            Overview
          </SectionLabelPill>
          {parsed.title && (
            <h1 className="text-[44px] font-light tracking-[-0.03em] leading-[1.02] mb-5 text-foreground">
              {parsed.title}
            </h1>
          )}
          {parsed.logline && (
            <p className="text-[17px] leading-[1.55] text-foreground/80 max-w-[58ch] font-normal tracking-tight">
              {parsed.logline}
            </p>
          )}

          {parsed.taglines.length > 0 && (
            <div className="mt-8 rounded-[12px] bg-card/40 shadow-paper p-5 max-w-[60ch]">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Taglines
                </h3>
                <div className="flex-1 h-px bg-border/60" />
                {onContentUpdate && jsonData && (
                  <button
                    onClick={handleRefreshTaglines}
                    disabled={refreshingTaglines}
                    className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Generate new taglines"
                  >
                    {refreshingTaglines ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <RefreshCw size={11} />
                    )}
                    Shuffle
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {parsed.taglines.map((t, i) => (
                  <li
                    key={`${i}-${t}`}
                    className="text-[14px] leading-[1.55] text-foreground/80 italic tracking-tight"
                  >
                    “{t.replace(/^["“]|["”]$/g, "")}”
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.identity.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border/60 max-w-[60ch]">
              <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
                Film Identity
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                {parsed.identity.map((item) => (
                  <div key={item.label} className="space-y-1 min-w-0">
                    <dt className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-[13px] text-foreground/85 truncate tracking-tight">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {hasCarousel && (
          <PosterCarousel posterContent={posterContent} posterImages={posterImages!} />
        )}
      </header>

      {parsed.synopsis && (
        <section>
          <SectionHead index={1} label="Synopsis" labelIcon={<FileText size={10} />}>
            Story in brief
          </SectionHead>
          <p className="text-[15px] leading-[1.75] text-foreground/80 whitespace-pre-line max-w-[65ch] tracking-tight">
            {parsed.synopsis}
          </p>
        </section>
      )}

      {parsed.themes.length > 0 && (
        <section>
          <SectionHead index={2} label="Themes" labelIcon={<Sparkles size={10} />}>
            What the film is about
          </SectionHead>
          <div className="space-y-6 max-w-[65ch]">
            {parsed.themes.map((t) => (
              <div key={t.title}>
                <h3 className="text-[14px] font-medium text-foreground mb-2 tracking-tight">
                  {t.title}
                </h3>
                <p className="text-[13px] leading-[1.7] text-foreground/70 tracking-tight">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(parsed.stats.length > 0 || parsed.complexity) && (
        <section>
          <SectionHead index={3} label="Scope" labelIcon={<BarChart3 size={10} />}>
            Production footprint
          </SectionHead>
          {parsed.stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-border/50 rounded-[12px] overflow-hidden mb-6 shadow-paper">
              {parsed.stats.map((s) => {
                const leadingNum = s.value.match(/^(\d[\d.,]*)/);
                const shortValue = leadingNum ? leadingNum[1] : s.value;
                return (
                  <div
                    key={s.label}
                    className="bg-card/40 px-5 py-6 flex flex-col gap-2"
                  >
                    <div className="text-[34px] font-light text-foreground tabular-nums leading-none tracking-[-0.03em]">
                      {shortValue}
                    </div>
                    <div className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground leading-snug">
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {parsed.complexity && (
            <div className="rounded-[12px] bg-card/40 shadow-paper p-5 max-w-[65ch]">
              <div className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Complexity Read
              </div>
              <p className="text-[13px] leading-[1.7] text-foreground/80 tracking-tight">
                {parsed.complexity}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
