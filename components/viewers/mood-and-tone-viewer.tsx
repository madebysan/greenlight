"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { replaceMarkdownSection } from "@/lib/markdown-utils";
import { SectionHead } from "@/components/ui/section-head";

type ColorEntry = { name: string; hex: string; description: string };
type ReferenceEntry = { title: string; description: string };
type SimilarMoodEntry = { title: string; year?: number; description: string };
type SoundtrackEntry = {
  title: string;
  year?: number;
  composer: string;
  description: string;
};

type ParsedMoodAndTone = {
  atmosphere: string;
  descriptors: string[];
  palette: ColorEntry[];
  musicProse: string;
  soundtracks: SoundtrackEntry[];
  references: ReferenceEntry[];
  similarMoods: SimilarMoodEntry[];
};

type ResolvedFilm = {
  query: string;
  tmdb_id: number | null;
  title: string | null;
  year: number | null;
  poster_url: string | null;
};

export function parseMoodAndTone(md: string): ParsedMoodAndTone {
  const result: ParsedMoodAndTone = {
    atmosphere: "",
    descriptors: [],
    palette: [],
    musicProse: "",
    soundtracks: [],
    references: [],
    similarMoods: [],
  };

  const sections = md.split(/^## /m).slice(1);

  for (const section of sections) {
    const [heading, ...bodyLines] = section.split("\n");
    const body = bodyLines.join("\n").trim();
    const h = heading.toLowerCase().trim();

    if (h.includes("atmosphere")) {
      result.atmosphere = body.trim();
    } else if (h.includes("tonal descriptor")) {
      const line = body.split("\n").find((l) => l.trim().length > 0) || "";
      result.descriptors = line
        .split(/[·•]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (h.includes("color palette")) {
      const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
      for (const line of lines) {
        const match = line.match(/-\s*\*\*([^*]+)\*\*\s*`(#[0-9a-fA-F]{3,8})`\s*—\s*(.+)/);
        if (match) {
          result.palette.push({
            name: match[1].trim(),
            hex: match[2].trim(),
            description: match[3].trim(),
          });
        }
      }
    } else if (h.includes("music") || h.includes("sound")) {
      // Split body around the ### Soundtrack References subheading.
      const [prose, ...refBlock] = body.split(/^###\s+soundtrack references?/im);
      result.musicProse = prose.trim();

      if (refBlock.length > 0) {
        const refLines = refBlock
          .join("")
          .split("\n")
          .filter((l) => l.trim().startsWith("-"));
        for (const line of refLines) {
          // - **Title (Year)** — Composer — description
          const match = line.match(/-\s*\*\*([^*]+)\*\*\s*—\s*([^—]+)\s*—\s*(.+)/);
          if (!match) continue;
          const rawTitle = match[1].trim();
          const composer = match[2].trim();
          const description = match[3].trim();
          const yearMatch = rawTitle.match(/^(.+?)\s*\((\d{4})\)\s*$/);
          result.soundtracks.push({
            title: yearMatch ? yearMatch[1].trim() : rawTitle,
            year: yearMatch ? Number(yearMatch[2]) : undefined,
            composer,
            description,
          });
        }
      }
    } else if (h.includes("similar mood") || h.includes("similar films")) {
      // - **Title (Year)** — description
      // Accept both "Similar Moods" and legacy "Similar Films" headings so
      // old cached content still parses.
      const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
      for (const line of lines) {
        const match = line.match(/-\s*\*\*([^*]+)\*\*\s*—\s*(.+)/);
        if (!match) continue;
        const rawTitle = match[1].trim();
        const description = match[2].trim();
        const yearMatch = rawTitle.match(/^(.+?)\s*\((\d{4})\)\s*$/);
        if (yearMatch) {
          result.similarMoods.push({
            title: yearMatch[1].trim(),
            year: Number(yearMatch[2]),
            description,
          });
        } else {
          result.similarMoods.push({ title: rawTitle, description });
        }
      }
    } else if (h.includes("reference")) {
      const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
      for (const line of lines) {
        const match = line.match(/-\s*\*\*([^*]+(?:\*[^*]+\*[^*]*)?)\*\*\s*—\s*(.+)/);
        if (match) {
          result.references.push({
            title: match[1].replace(/\*/g, "").trim(),
            description: match[2].trim(),
          });
        }
      }
    }
  }

  return result;
}

type MoodAndToneViewerProps = {
  content: string;
  jsonData?: string;
  onContentUpdate?: (newContent: string) => void;
};

export function MoodAndToneViewer({ content, jsonData, onContentUpdate }: MoodAndToneViewerProps) {
  const parsed = useMemo(() => parseMoodAndTone(content), [content]);
  const [reshufflingMusic, setReshufflingMusic] = useState(false);

  const handleReshuffleMusic = async () => {
    if (!jsonData || !onContentUpdate) return;
    setReshufflingMusic(true);
    try {
      const res = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey: "mood-and-tone/music", jsonData }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { content: newSection } = await res.json();
      const updated = replaceMarkdownSection(content, "Music & Sound Direction", newSection);
      onContentUpdate(updated);
    } catch (e) {
      console.error("Music reshuffle failed", e);
    } finally {
      setReshufflingMusic(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-14">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Mood & Tone</h1>
        <p className="text-[13px] text-muted-foreground">
          The film&apos;s atmospheric identity — for the director, DP, production designer, and composer.
        </p>
      </header>

      {parsed.atmosphere && (
        <section>
          <SectionHead index={1}>Atmosphere</SectionHead>
          <div className="text-[15px] leading-[1.75] text-foreground/85 whitespace-pre-line">
            {parsed.atmosphere}
          </div>
        </section>
      )}

      {parsed.descriptors.length > 0 && (
        <section>
          <SectionHead index={2}>Tonal Descriptors</SectionHead>
          <div className="flex flex-wrap gap-1.5">
            {parsed.descriptors.map((d, i) => (
              <span
                key={`${i}-${d}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-border/80 bg-card/40 text-[12px] font-mono tracking-tight text-foreground/80"
              >
                {d}
              </span>
            ))}
          </div>
        </section>
      )}

      {parsed.references.length > 0 && (
        <section>
          <SectionHead index={3}>Reference Points</SectionHead>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {parsed.references.map((r) => (
              <div
                key={r.title}
                className="rounded-lg border border-border/60 bg-card/40 p-4"
              >
                <div className="text-[12px] font-semibold text-foreground leading-snug">
                  {r.title}
                </div>
                <p className="text-[11px] text-foreground/65 leading-[1.6] mt-1.5">
                  {r.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(parsed.musicProse || parsed.soundtracks.length > 0) && (
        <section>
          <SectionHead
            index={4}
            meta={
              onContentUpdate && jsonData ? (
                <button
                  onClick={handleReshuffleMusic}
                  disabled={reshufflingMusic}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                  title="Regenerate music direction"
                >
                  {reshufflingMusic ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <RefreshCw size={11} />
                  )}
                  Shuffle
                </button>
              ) : null
            }
          >
            Music & Sound
          </SectionHead>

          {parsed.musicProse && (
            <div className="text-[14px] leading-[1.75] text-foreground/85 whitespace-pre-line">
              {parsed.musicProse}
            </div>
          )}

          {parsed.soundtracks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Soundtrack References
              </h3>
              <SoundtrackGrid tracks={parsed.soundtracks} />
            </div>
          )}
        </section>
      )}

      {parsed.similarMoods.length > 0 && (
        <section>
          <SectionHead index={5}>Similar Moods</SectionHead>
          <SimilarMoodsGrid films={parsed.similarMoods.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}

function SimilarMoodsGrid({ films }: { films: SimilarMoodEntry[] }) {
  const [resolved, setResolved] = useState<Record<string, ResolvedFilm>>({});
  const [loading, setLoading] = useState(true);

  const queryKey = useMemo(
    () => films.map((f) => `${f.title}|${f.year || ""}`).join("\n"),
    [films],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/tmdb-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: films.map((f) => ({ title: f.title, year: f.year })),
      }),
    })
      .then((r) => r.json())
      .then((data: { films: ResolvedFilm[] }) => {
        if (cancelled) return;
        const map: Record<string, ResolvedFilm> = {};
        for (const f of data.films || []) map[f.query] = f;
        setResolved(map);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, films]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {films.map((f) => {
        const r = resolved[f.title];
        return (
          <div
            key={`${f.title}-${f.year || ""}`}
            className="flex gap-3 rounded-lg border border-border/60 bg-card/30 p-3"
          >
            <div className="w-14 aspect-[2/3] rounded-md overflow-hidden bg-muted/40 border border-border/60 shrink-0 relative">
              {loading ? (
                <div className="absolute inset-0 animate-pulse bg-muted/40" />
              ) : r?.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.poster_url}
                  alt={f.title}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-foreground leading-snug">
                {f.title}
                {f.year && (
                  <span className="text-muted-foreground font-normal"> · {f.year}</span>
                )}
              </div>
              <p className="text-[11px] text-foreground/65 leading-[1.55] mt-1.5">
                {f.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SoundtrackGrid({ tracks }: { tracks: SoundtrackEntry[] }) {
  const [resolved, setResolved] = useState<Record<string, ResolvedFilm>>({});
  const [loading, setLoading] = useState(true);

  const queryKey = useMemo(
    () => tracks.map((t) => `${t.title}|${t.year || ""}`).join("\n"),
    [tracks],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/tmdb-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: tracks.map((t) => ({ title: t.title, year: t.year })),
      }),
    })
      .then((r) => r.json())
      .then((data: { films: ResolvedFilm[] }) => {
        if (cancelled) return;
        const map: Record<string, ResolvedFilm> = {};
        for (const f of data.films || []) map[f.query] = f;
        setResolved(map);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, tracks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {tracks.map((t) => {
        const r = resolved[t.title];
        return (
          <div
            key={`${t.title}-${t.year || ""}`}
            className="flex gap-3 rounded-lg border border-border/60 bg-card/30 p-3"
          >
            <div className="w-14 aspect-[2/3] rounded-md overflow-hidden bg-muted/40 border border-border/60 shrink-0 relative">
              {loading ? (
                <div className="absolute inset-0 animate-pulse bg-muted/40" />
              ) : r?.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.poster_url}
                  alt={t.title}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-foreground leading-snug">
                {t.title}
                {t.year && (
                  <span className="text-muted-foreground font-normal"> · {t.year}</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                {t.composer}
              </div>
              <p className="text-[11px] text-foreground/65 leading-[1.55] mt-1.5">
                {t.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

