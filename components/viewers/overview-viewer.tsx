"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { replaceMarkdownSection } from "@/lib/markdown-utils";
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
    <div className="max-w-5xl space-y-14">
      <header className={hasCarousel ? "grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8 items-start" : ""}>
        <div>
          {parsed.title && (
            <h1 className="text-3xl font-semibold tracking-tight mb-4">{parsed.title}</h1>
          )}
          {parsed.logline && (
            <p className="text-[17px] leading-[1.55] text-foreground/90 max-w-[60ch] font-medium">
              {parsed.logline}
            </p>
          )}

          {parsed.taglines.length > 0 && (
            <div className="mt-6 rounded-xl border border-border/60 bg-card/30 p-5 max-w-[60ch]">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Taglines
                </h3>
                <div className="flex-1 h-px bg-border/60" />
                {onContentUpdate && jsonData && (
                  <button
                    onClick={handleRefreshTaglines}
                    disabled={refreshingTaglines}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="text-[14px] leading-[1.5] text-foreground/85 italic"
                  >
                    “{t.replace(/^["“]|["”]$/g, "")}”
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.identity.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border/60 max-w-[60ch]">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Film Identity
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {parsed.identity.map((item) => (
                  <div key={item.label} className="space-y-0.5 min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-[13px] text-foreground/85 truncate">{item.value}</dd>
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
          <SectionLabel>Synopsis</SectionLabel>
          <p className="text-[14px] leading-[1.75] text-foreground/80 whitespace-pre-line">
            {parsed.synopsis}
          </p>
        </section>
      )}

      {parsed.themes.length > 0 && (
        <section>
          <SectionLabel>Themes</SectionLabel>
          <div className="space-y-5">
            {parsed.themes.map((t) => (
              <div key={t.title}>
                <h3 className="text-[13px] font-semibold text-foreground mb-1.5">
                  {t.title}
                </h3>
                <p className="text-[13px] leading-[1.7] text-foreground/70">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(parsed.stats.length > 0 || parsed.complexity) && (
        <section>
          <SectionLabel>Scope at a Glance</SectionLabel>
          {parsed.stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-5">
              {parsed.stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border/60 bg-card/30 px-3 py-3"
                >
                  <div className="text-2xl font-semibold text-foreground tabular-nums leading-none">
                    {s.value}
                  </div>
                  <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-1.5 leading-snug">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
          {parsed.complexity && (
            <div className="rounded-xl border border-border/60 bg-card/20 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Complexity Read
              </div>
              <p className="text-[13px] leading-[1.7] text-foreground/80">
                {parsed.complexity}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {children}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
