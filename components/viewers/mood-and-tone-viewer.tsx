"use client";

import { useEffect, useMemo, useState } from "react";
import { Wind, Tag, BookOpen, Music, Film, Sparkles } from "lucide-react";
import { replaceMarkdownSection } from "@/lib/markdown-utils";
import { SectionHead } from "@/components/ui/section-head";
import { SectionLabelPill } from "@/components/ui/inline-chip";
import { ShuffleButton, useShuffleState } from "@/components/ui/shuffle-button";

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

function CollapsibleProse({ text, sentenceCount = 3 }: { text: string; sentenceCount?: number }) {
  const [expanded, setExpanded] = useState(false);
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const lead = sentences.slice(0, sentenceCount).join(" ").trim();
  const hasMore = sentences.length > sentenceCount;

  return (
    <div className="max-w-[65ch]">
      <p className="text-[15px] leading-[1.75] text-foreground/80 tracking-tight">
        {expanded ? text : lead}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-[3px] decoration-border"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function AtmosphereSection({
  atmosphere,
  shuffleSlot,
}: {
  atmosphere: string;
  shuffleSlot?: React.ReactNode;
}) {
  return (
    <section>
      <SectionHead index={1} label="Atmosphere" labelIcon={<Wind size={10} />} meta={shuffleSlot}>
        Feel of the film
      </SectionHead>
      <CollapsibleProse text={atmosphere} />
    </section>
  );
}

type MoodAndToneViewerProps = {
  content: string;
  jsonData?: string;
  onContentUpdate?: (newContent: string) => void;
};

export function MoodAndToneViewer({ content, jsonData, onContentUpdate }: MoodAndToneViewerProps) {
  const parsed = useMemo(() => parseMoodAndTone(content), [content]);
  const musicShuffle = useShuffleState();
  const atmosphereShuffle = useShuffleState();
  const referencesShuffle = useShuffleState();
  const similarMoodsShuffle = useShuffleState();

  // Replace multiple ## sections in one pass. The returned content may contain
  // several ## headings; we split it on those boundaries and replace each in
  // turn. Used by atmosphere (Atmosphere + Tonal Descriptors) and music
  // (Music & Sound Direction includes a sub-### Soundtrack References, but the
  // top-level heading is just one ## so single-replace works for that case).
  function applyMultiSectionReplace(md: string, returnedBlock: string): string {
    const trimmed = returnedBlock.trim();
    if (!trimmed.startsWith("##")) {
      // Doesn't look like our format — bail and let single replace try.
      return md;
    }
    // Split into [headingLine, body] pairs at each ## (top-level only, not ###)
    const sections = trimmed.split(/^##\s+/m).filter((s) => s.trim());
    let result = md;
    for (const section of sections) {
      const lines = section.split("\n");
      const heading = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();
      const fullSection = `## ${heading}\n${body}`;
      result = replaceMarkdownSection(result, heading, fullSection);
    }
    return result;
  }

  async function shuffleSection(
    state: ReturnType<typeof useShuffleState>,
    sectionKey: string,
    primarySectionHeading: string,
  ) {
    if (!jsonData || !onContentUpdate) return;
    await state.run(async () => {
      const res = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, jsonData }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { content: newSection } = await res.json();
      // Detect multi-section payload — if Claude returned more than one ##
      // heading, splice each separately. Otherwise standard single replace.
      const headingCount = (newSection.match(/^##\s+/gm) || []).length;
      const updated =
        headingCount > 1
          ? applyMultiSectionReplace(content, newSection)
          : replaceMarkdownSection(content, primarySectionHeading, newSection);
      onContentUpdate(updated);
    });
  }

  return (
    <div className="max-w-4xl space-y-16">
      <header>
        <SectionLabelPill icon={<Sparkles size={10} />} className="mb-3">
          Atmosphere
        </SectionLabelPill>
        <h1 className="text-[32px] font-light tracking-[-0.025em] leading-[1.05] mb-2 text-foreground">
          Mood & Tone
        </h1>
        <p className="text-[13px] text-foreground/60 tracking-tight max-w-[60ch]">
          The film&apos;s atmospheric identity — mood, references, and sonic direction.
        </p>
      </header>

      {parsed.atmosphere && (
        <div
          className={`transition-opacity duration-200 ${
            atmosphereShuffle.state === "loading" ? "opacity-40" : "opacity-100"
          }`}
        >
          <AtmosphereSection
            atmosphere={parsed.atmosphere}
            shuffleSlot={
              onContentUpdate && jsonData ? (
                <ShuffleButton
                  onClick={() =>
                    shuffleSection(atmosphereShuffle, "mood-and-tone/atmosphere", "Atmosphere")
                  }
                  state={atmosphereShuffle.state}
                  title="Rewrite the atmosphere prose and tonal descriptors"
                />
              ) : null
            }
          />
        </div>
      )}

      {parsed.descriptors.length > 0 && (
        <section
          className={`transition-opacity duration-200 ${
            atmosphereShuffle.state === "loading" ? "opacity-40" : "opacity-100"
          }`}
        >
          <SectionHead index={2} label="Tonal" labelIcon={<Tag size={10} />}>
            Tonal Descriptors
          </SectionHead>
          <div className="flex flex-wrap gap-1.5">
            {parsed.descriptors.map((d, i) => (
              <span
                key={`${i}-${d}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.04] text-[11px] font-mono tracking-tight text-foreground/80 shadow-pill"
              >
                {d}
              </span>
            ))}
          </div>
        </section>
      )}

      {parsed.references.length > 0 && (
        <section>
          <SectionHead
            index={3}
            label="References"
            labelIcon={<BookOpen size={10} />}
            meta={
              onContentUpdate && jsonData ? (
                <ShuffleButton
                  onClick={() =>
                    shuffleSection(
                      referencesShuffle,
                      "mood-and-tone/reference-points",
                      "Reference Points",
                    )
                  }
                  state={referencesShuffle.state}
                  title="Generate new reference points"
                />
              ) : null
            }
          >
            Reference Points
          </SectionHead>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-3 transition-opacity duration-200 ${
              referencesShuffle.state === "loading" ? "opacity-40" : "opacity-100"
            }`}
          >
            {parsed.references.map((r) => (
              <div
                key={r.title}
                className="rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover p-4 transition-all"
              >
                <div className="text-[13px] font-medium text-foreground leading-snug tracking-tight">
                  {r.title}
                </div>
                <p className="text-[12px] text-foreground/70 leading-[1.6] mt-1.5 tracking-tight">
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
            label="Sound"
            labelIcon={<Music size={10} />}
            meta={
              onContentUpdate && jsonData ? (
                <ShuffleButton
                  onClick={() =>
                    shuffleSection(musicShuffle, "mood-and-tone/music", "Music & Sound Direction")
                  }
                  state={musicShuffle.state}
                  title="Regenerate music direction"
                />
              ) : null
            }
          >
            Music & Sound
          </SectionHead>

          <div
            className={`transition-opacity duration-200 ${
              musicShuffle.state === "loading" ? "opacity-40" : "opacity-100"
            }`}
          >
            {parsed.musicProse && <CollapsibleProse text={parsed.musicProse} />}

            {parsed.soundtracks.length > 0 && (
              <div className="mt-6">
                <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Soundtrack References
                </h3>
                <SoundtrackGrid tracks={parsed.soundtracks} />
              </div>
            )}
          </div>
        </section>
      )}

      {parsed.similarMoods.length > 0 && (
        <section>
          <SectionHead
            index={5}
            label="Echoes"
            labelIcon={<Film size={10} />}
            meta={
              onContentUpdate && jsonData ? (
                <ShuffleButton
                  onClick={() =>
                    shuffleSection(similarMoodsShuffle, "mood-and-tone/similar-moods", "Similar Moods")
                  }
                  state={similarMoodsShuffle.state}
                  title="Generate new similar films"
                />
              ) : null
            }
          >
            Similar Moods
          </SectionHead>
          <div
            className={`transition-opacity duration-200 ${
              similarMoodsShuffle.state === "loading" ? "opacity-40" : "opacity-100"
            }`}
          >
            <SimilarMoodsGrid films={parsed.similarMoods.slice(0, 4)} />
          </div>
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
            className="flex gap-3 rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover p-3 transition-all"
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
              <div className="text-[13px] font-semibold text-foreground leading-snug">
                {f.title}
                {f.year && (
                  <span className="text-muted-foreground font-normal font-mono text-[11px] ml-1">· {f.year}</span>
                )}
              </div>
              <p className="text-[12px] text-foreground/70 leading-[1.55] mt-1.5">
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
            className="flex gap-3 rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover p-3 transition-all"
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
              <div className="text-[13px] font-semibold text-foreground leading-snug">
                {t.title}
                {t.year && (
                  <span className="text-muted-foreground font-normal font-mono text-[11px] ml-1">· {t.year}</span>
                )}
              </div>
              <div className="font-mono text-[9px] text-muted-foreground mt-1 uppercase tracking-[0.15em]">
                {t.composer}
              </div>
              <p className="text-[12px] text-foreground/70 leading-[1.55] mt-1.5">
                {t.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

