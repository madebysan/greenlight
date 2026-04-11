"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Star } from "lucide-react";
import type { SavedImage, SavedProject } from "@/lib/reports";
import { parseOverview } from "@/components/viewers/overview-viewer";
import { parseMoodAndTone } from "@/components/viewers/mood-and-tone-viewer";
import { parseSceneBreakdown } from "@/components/viewers/scene-breakdown-viewer";
import {
  parseStoryboardPrompts,
  type StoryboardScene,
} from "@/components/viewers/storyboard-viewer";
import { parsePosterConcepts } from "@/components/viewers/poster-concepts-viewer";

// Full bible. Every section, every card, every scene — expanded, no tabs, no
// collapsibles, no interactive affordances. Designed to scroll as one long
// page and print cleanly to a multi-page PDF via the browser's print dialog.

type ScreenplayData = {
  title?: string;
  writer?: string;
  genre?: string[];
  characters?: {
    name: string;
    description?: string;
    arc_summary?: string;
    scenes_present?: number[];
    wardrobe_changes?: number;
  }[];
  locations?: {
    name: string;
    description: string;
    scenes?: number[];
    int_ext?: string;
    time_variations?: string[];
    set_requirements?: string[];
  }[];
  props_master?: {
    item: string;
    scenes: number[];
    hero_prop?: boolean;
    notes?: string;
  }[];
  scenes?: {
    scene_number: number;
    slug_line: string;
    key_visual_moment?: string;
  }[];
};

type ResolvedFilm = {
  query: string;
  tmdb_id: number | null;
  title: string | null;
  year: number | null;
  poster_url: string | null;
};

type ShareableViewProps = {
  project: SavedProject;
};

export function ShareableView({ project }: ShareableViewProps) {
  const parsedJson = useMemo((): ScreenplayData => {
    try {
      return JSON.parse(project.jsonData || "{}");
    } catch {
      return {};
    }
  }, [project.jsonData]);

  const overviewDoc = project.documents.find((d) => d.slug === "overview");
  const moodDoc = project.documents.find((d) => d.slug === "mood-and-tone");
  const sceneDoc = project.documents.find((d) => d.slug === "scene-breakdown");
  const storyboardDoc = project.documents.find(
    (d) => d.slug === "storyboard-prompts",
  );
  const posterDoc = project.documents.find((d) => d.slug === "poster-concepts");

  const overview = useMemo(
    () => (overviewDoc?.content ? parseOverview(overviewDoc.content) : null),
    [overviewDoc?.content],
  );
  const mood = useMemo(
    () => (moodDoc?.content ? parseMoodAndTone(moodDoc.content) : null),
    [moodDoc?.content],
  );
  const sceneBreakdown = useMemo(
    () => (sceneDoc?.content ? parseSceneBreakdown(sceneDoc.content) : null),
    [sceneDoc?.content],
  );
  const storyboardByScene = useMemo((): Record<number, StoryboardScene> => {
    if (!storyboardDoc?.content) return {};
    const { acts } = parseStoryboardPrompts(storyboardDoc.content);
    const out: Record<number, StoryboardScene> = {};
    for (const act of acts) for (const s of act.scenes) out[s.number] = s;
    return out;
  }, [storyboardDoc?.content]);
  const posterConcepts = useMemo(
    () => (posterDoc?.content ? parsePosterConcepts(posterDoc.content) : null),
    [posterDoc?.content],
  );

  const portraits = project.portraits || {};
  const propImages = project.propImages || {};
  const storyboardImages = project.images || {};
  const posterImages = project.posterImages || {};

  const title =
    overview?.title || parsedJson.title || project.title || "Untitled";
  const logline = overview?.logline || "";

  // Resolve TMDB posters for soundtracks + similar moods in one batch
  const tmdbQueries = useMemo(() => {
    const queries: { title: string; year?: number; kind: "soundtrack" | "mood" }[] = [];
    for (const t of mood?.soundtracks || []) {
      queries.push({ title: t.title, year: t.year, kind: "soundtrack" });
    }
    for (const f of mood?.similarMoods || []) {
      queries.push({ title: f.title, year: f.year, kind: "mood" });
    }
    return queries;
  }, [mood]);

  const [tmdbResolved, setTmdbResolved] = useState<Record<string, ResolvedFilm>>({});
  useEffect(() => {
    if (tmdbQueries.length === 0) return;
    let cancelled = false;
    fetch("/api/tmdb-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: tmdbQueries.map((q) => ({ title: q.title, year: q.year })),
      }),
    })
      .then((r) => r.json())
      .then((data: { films: ResolvedFilm[] }) => {
        if (cancelled) return;
        const map: Record<string, ResolvedFilm> = {};
        for (const f of data.films || []) map[f.query] = f;
        setTmdbResolved(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tmdbQueries]);

  const scenes = parsedJson.scenes || [];
  const characters = parsedJson.characters || [];
  const locations = parsedJson.locations || [];
  const propsMaster = parsedJson.props_master || [];

  // Build the table of contents based on which sections actually have content.
  // This stays in sync automatically — sections without data get skipped in
  // rendering below and also get filtered out here.
  const toc: { id: string; label: string; count?: number }[] = [];
  if (overview && overview.taglines.length > 0)
    toc.push({ id: "taglines", label: "Taglines" });
  if (overview?.synopsis) toc.push({ id: "synopsis", label: "Synopsis" });
  if (overview && overview.identity.length > 0)
    toc.push({ id: "film-identity", label: "Film Identity" });
  if (overview && overview.themes.length > 0)
    toc.push({ id: "themes", label: "Themes", count: overview.themes.length });
  if (overview && (overview.stats.length > 0 || overview.complexity))
    toc.push({ id: "scope", label: "Scope at a Glance" });
  if (mood?.atmosphere) toc.push({ id: "atmosphere", label: "Atmosphere" });
  if (mood && mood.descriptors.length > 0)
    toc.push({
      id: "tonal-descriptors",
      label: "Tonal Descriptors",
      count: mood.descriptors.length,
    });
  if (mood && mood.references.length > 0)
    toc.push({
      id: "reference-points",
      label: "Reference Points",
      count: mood.references.length,
    });
  if (mood && (mood.musicProse || mood.soundtracks.length > 0))
    toc.push({ id: "music-sound", label: "Music & Sound" });
  if (mood && mood.palette.length > 0)
    toc.push({
      id: "color-palette",
      label: "Color Palette",
      count: mood.palette.length,
    });
  if (mood && mood.similarMoods.length > 0)
    toc.push({
      id: "similar-moods",
      label: "Similar Moods",
      count: Math.min(mood.similarMoods.length, 4),
    });
  if (sceneBreakdown && sceneBreakdown.scenes.length > 0)
    toc.push({
      id: "scenes",
      label: "Scenes",
      count: sceneBreakdown.scenes.length,
    });
  if (locations.length > 0)
    toc.push({ id: "locations", label: "Locations", count: locations.length });
  if (characters.length > 0)
    toc.push({ id: "cast", label: "Cast", count: characters.length });
  if (propsMaster.length > 0)
    toc.push({
      id: "props",
      label: "Production Design · Props",
      count: propsMaster.length,
    });
  if (posterConcepts && posterConcepts.concepts.length > 0)
    toc.push({
      id: "poster-concepts",
      label: "Poster Concepts",
      count: posterConcepts.concepts.length,
    });

  return (
    <>
      <PrintStyles />

      {/* Controls bar — hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border/60">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="/"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Greenlight
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground px-3 py-1.5 rounded-md border border-border hover:border-foreground/30 transition-colors"
          >
            <Printer size={14} />
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="shareable-page max-w-5xl mx-auto px-10 py-16 space-y-16">
        {/* HERO */}
        <header className="break-inside-avoid">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
            First-Pass Breakdown
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.02] text-foreground">
            {title}
          </h1>
          {parsedJson.writer && (
            <p className="text-[13px] font-mono uppercase tracking-[0.15em] text-muted-foreground mt-4">
              Written by <span className="text-foreground/80">{parsedJson.writer}</span>
            </p>
          )}
          {logline && (
            <p className="text-[17px] leading-[1.55] text-foreground/85 mt-6 font-medium max-w-[72ch]">
              {logline}
            </p>
          )}
          {parsedJson.genre && parsedJson.genre.length > 0 && (
            <div className="flex items-center gap-2 mt-6">
              {parsedJson.genre.map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* TABLE OF CONTENTS */}
        <Section label="Contents">
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
            {toc.map((entry, i) => (
              <li
                key={entry.id}
                className="flex items-baseline gap-3 border-b border-dotted border-border/40 pb-1.5"
              >
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <a
                  href={`#${entry.id}`}
                  className="text-foreground/85 hover:text-foreground transition-colors"
                >
                  {entry.label}
                </a>
                <span className="flex-1" />
                {entry.count !== undefined && (
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {entry.count}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Section>

        {/* TAGLINES */}
        {overview && overview.taglines.length > 0 && (
          <Section id="taglines" label="Taglines">
            <ul className="space-y-2">
              {overview.taglines.map((t, i) => (
                <li
                  key={`${i}-${t}`}
                  className="text-[16px] leading-[1.5] text-foreground/85 italic"
                >
                  “{t.replace(/^["“]|["”]$/g, "")}”
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* SYNOPSIS */}
        {overview?.synopsis && (
          <Section id="synopsis" label="Synopsis">
            <p className="text-[14px] leading-[1.75] text-foreground/80 whitespace-pre-line">
              {overview.synopsis}
            </p>
          </Section>
        )}

        {/* FILM IDENTITY */}
        {overview && overview.identity.length > 0 && (
          <Section id="film-identity" label="Film Identity">
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
              {overview.identity.map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="text-[13px] text-foreground/85">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {/* THEMES */}
        {overview && overview.themes.length > 0 && (
          <Section id="themes" label="Themes">
            <div className="space-y-5">
              {overview.themes.map((t) => (
                <div key={t.title} className="break-inside-avoid">
                  <h3 className="text-[13px] font-semibold text-foreground mb-1.5">
                    {t.title}
                  </h3>
                  <p className="text-[13px] leading-[1.7] text-foreground/70">{t.body}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* SCOPE */}
        {overview && (overview.stats.length > 0 || overview.complexity) && (
          <Section id="scope" label="Scope at a Glance">
            {overview.stats.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
                {overview.stats.map((s) => (
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
            {overview.complexity && (
              <div className="rounded-xl border border-border/60 bg-card/20 p-5">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Complexity Read
                </div>
                <p className="text-[13px] leading-[1.7] text-foreground/80">
                  {overview.complexity}
                </p>
              </div>
            )}
          </Section>
        )}

        {/* ATMOSPHERE */}
        {mood?.atmosphere && (
          <Section id="atmosphere" label="Atmosphere">
            <p className="text-[14px] leading-[1.75] text-foreground/85 whitespace-pre-line">
              {mood.atmosphere}
            </p>
          </Section>
        )}

        {/* TONAL DESCRIPTORS */}
        {mood && mood.descriptors.length > 0 && (
          <Section id="tonal-descriptors" label="Tonal Descriptors">
            <div className="flex flex-wrap gap-1.5">
              {mood.descriptors.map((d, i) => (
                <span
                  key={`${i}-${d}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-border/80 bg-card/40 text-[12px] font-mono tracking-tight text-foreground/80"
                >
                  {d}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* REFERENCE POINTS */}
        {mood && mood.references.length > 0 && (
          <Section id="reference-points" label="Reference Points">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mood.references.map((r) => (
                <div
                  key={r.title}
                  className="rounded-lg border border-border/60 bg-card/40 p-4 break-inside-avoid"
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
          </Section>
        )}

        {/* MUSIC & SOUND + SOUNDTRACK REFERENCES */}
        {mood && (mood.musicProse || mood.soundtracks.length > 0) && (
          <Section id="music-sound" label="Music & Sound">
            {mood.musicProse && (
              <p className="text-[14px] leading-[1.75] text-foreground/85 whitespace-pre-line mb-6">
                {mood.musicProse}
              </p>
            )}
            {mood.soundtracks.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Soundtrack References
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mood.soundtracks.map((t) => (
                    <PosterCard
                      key={`sound-${t.title}`}
                      posterUrl={tmdbResolved[t.title]?.poster_url || null}
                      title={t.title}
                      year={t.year}
                      subtitle={t.composer}
                      description={t.description}
                    />
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* COLOR PALETTE */}
        {mood && mood.palette.length > 0 && (
          <Section id="color-palette" label="Color Palette">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mood.palette.map((c) => (
                <div
                  key={c.hex}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 break-inside-avoid"
                >
                  <div
                    className="w-10 h-10 rounded-md border border-border/60 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[12px] font-semibold text-foreground leading-tight">
                        {c.name}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">
                        {c.hex}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/65 leading-[1.55] mt-0.5">
                      {c.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* SIMILAR MOODS */}
        {mood && mood.similarMoods.length > 0 && (
          <Section id="similar-moods" label="Similar Moods">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mood.similarMoods.slice(0, 4).map((f) => (
                <PosterCard
                  key={`mood-${f.title}`}
                  posterUrl={tmdbResolved[f.title]?.poster_url || null}
                  title={f.title}
                  year={f.year}
                  description={f.description}
                />
              ))}
            </div>
          </Section>
        )}

        {/* SCENES (every scene, expanded, with storyboard) */}
        {sceneBreakdown && sceneBreakdown.scenes.length > 0 && (
          <Section id="scenes" label="Scenes">
            <div className="space-y-4">
              {sceneBreakdown.scenes.map((s) => (
                <SceneFull
                  key={s.number}
                  scene={s}
                  storyboard={storyboardByScene[s.number]}
                  image={storyboardImages[s.number]}
                />
              ))}
            </div>
          </Section>
        )}

        {/* LOCATIONS (expanded) */}
        {locations.length > 0 && (
          <Section id="locations" label="Locations">
            <div className="space-y-4">
              {locations.map((loc) => {
                const sceneCount = loc.scenes?.length || 0;
                const locScenes = scenes.filter((sc) =>
                  loc.scenes?.includes(sc.scene_number),
                );
                return (
                  <div
                    key={loc.name}
                    className="rounded-xl border bg-card/40 p-5 break-inside-avoid"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-base font-semibold capitalize text-foreground">
                          {loc.name}
                        </h3>
                        <p className="text-[13px] leading-[1.6] text-foreground/70 mt-1">
                          {loc.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {loc.int_ext && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            {loc.int_ext}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {sceneCount} {sceneCount === 1 ? "scene" : "scenes"}
                        </span>
                      </div>
                    </div>
                    {loc.time_variations && loc.time_variations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {loc.time_variations.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {loc.set_requirements && loc.set_requirements.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Set Requirements
                        </h4>
                        <ul className="text-[12px] space-y-1 text-foreground/70">
                          {loc.set_requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {locScenes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Key Visual Moments
                        </h4>
                        <ul className="text-[12px] space-y-1.5 text-foreground/70">
                          {locScenes.map((sc) => (
                            <li
                              key={sc.scene_number}
                              className="flex items-start gap-2"
                            >
                              <span className="text-muted-foreground font-mono shrink-0">
                                S{sc.scene_number}
                              </span>
                              <span className="leading-relaxed">{sc.key_visual_moment}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* CAST */}
        {characters.length > 0 && (
          <Section id="cast" label="Cast">
            <div className="space-y-3">
              {characters.map((char) => {
                const portrait = portraits[char.name];
                return (
                  <div
                    key={char.name}
                    className="rounded-xl border bg-card/40 p-5 flex gap-5 break-inside-avoid"
                  >
                    <div className="w-24 h-24 rounded-lg shrink-0 bg-muted/40 border border-border/60 overflow-hidden">
                      {portrait?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={portrait.url}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        {char.name}
                      </h3>
                      {char.description && (
                        <p className="text-[12px] text-foreground/70 mt-1 leading-relaxed">
                          {char.description}
                        </p>
                      )}
                      {char.arc_summary && (
                        <p className="text-[12px] text-muted-foreground/90 italic mt-2 leading-relaxed">
                          {char.arc_summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                        <span>{char.scenes_present?.length || 0} scenes</span>
                        {char.wardrobe_changes !== undefined &&
                          char.wardrobe_changes > 0 && (
                            <>
                              <span>·</span>
                              <span>{char.wardrobe_changes} wardrobe changes</span>
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* PRODUCTION DESIGN — PROPS */}
        {propsMaster.length > 0 && (
          <Section id="props" label="Production Design · Props">
            <div className="space-y-3">
              {propsMaster.map((p) => {
                const img = propImages[p.item];
                return (
                  <div
                    key={p.item}
                    className="rounded-xl border bg-card/40 p-5 flex gap-5 break-inside-avoid"
                  >
                    <div className="w-24 h-24 rounded-lg shrink-0 bg-muted/40 border border-border/60 overflow-hidden">
                      {img?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.url}
                          alt={p.item}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold capitalize text-foreground">
                            {p.item}
                          </h3>
                          {p.hero_prop && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500/90">
                              <Star size={10} className="fill-current" />
                              Hero
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {p.scenes.length}{" "}
                          {p.scenes.length === 1 ? "scene" : "scenes"}
                        </span>
                      </div>
                      {p.notes && (
                        <p className="text-[13px] leading-[1.6] text-foreground/70 mt-1">
                          {p.notes}
                        </p>
                      )}
                      {p.scenes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {p.scenes.map((sn) => (
                            <span
                              key={sn}
                              className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                            >
                              S{sn}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* POSTER CONCEPTS */}
        {posterConcepts && posterConcepts.concepts.length > 0 && (
          <Section id="poster-concepts" label="Poster Concepts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posterConcepts.concepts.map((concept) => {
                const img = posterImages[concept.number];
                return (
                  <div
                    key={concept.number}
                    className="rounded-xl border bg-card/40 p-4 break-inside-avoid"
                  >
                    <div className="flex gap-4">
                      <div className="w-[120px] shrink-0">
                        <div
                          className="rounded-lg overflow-hidden border bg-muted/30"
                          style={{ aspectRatio: "5/7" }}
                        >
                          {img?.url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img.url}
                              alt={`Poster — ${concept.name}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        {concept.colors.length > 0 && (
                          <div className="flex rounded overflow-hidden h-2 mt-2">
                            {concept.colors.map((c, i) => (
                              <div
                                key={i}
                                className="flex-1"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                          {concept.category}
                        </div>
                        <h3 className="text-[14px] font-semibold text-foreground leading-tight">
                          {concept.name}
                        </h3>
                        {concept.tagline && (
                          <p className="text-[11px] italic text-foreground/80 mt-1.5">
                            “{concept.tagline}”
                          </p>
                        )}
                        {concept.composition && (
                          <p className="text-[11px] text-foreground/65 leading-[1.55] mt-2">
                            {concept.composition}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* FOOTER */}
        <footer className="pt-10 mt-10 border-t border-border/60">
          <div className="flex items-end justify-between text-[11px] text-muted-foreground">
            <div>
              Generated by <span className="text-foreground/70 font-medium">Greenlight</span>
            </div>
            <div className="text-right">
              {new Date(project.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
              })}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function Section({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="break-before-auto scroll-mt-16">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </section>
  );
}

function PosterCard({
  posterUrl,
  title,
  year,
  subtitle,
  description,
}: {
  posterUrl: string | null;
  title: string;
  year?: number;
  subtitle?: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border/60 bg-card/30 p-3 break-inside-avoid">
      <div className="w-14 aspect-[2/3] rounded-md overflow-hidden bg-muted/40 border border-border/60 shrink-0">
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-foreground leading-snug">
          {title}
          {year && (
            <span className="text-muted-foreground font-normal"> · {year}</span>
          )}
        </div>
        {subtitle && (
          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
            {subtitle}
          </div>
        )}
        <p className="text-[11px] text-foreground/65 leading-[1.55] mt-1.5">
          {description}
        </p>
      </div>
    </div>
  );
}

type ParsedScene = {
  number: number;
  slugLine: string;
  intExt: "INT" | "EXT" | "";
  timeOfDay: string;
  fields: { label: string; value: string }[];
};

function SceneFull({
  scene,
  storyboard,
  image,
}: {
  scene: ParsedScene;
  storyboard?: StoryboardScene;
  image?: SavedImage;
}) {
  const characters = scene.fields.find((f) => f.label === "Characters")?.value || "";
  const pages = scene.fields.find((f) => f.label === "Pages")?.value || "";

  return (
    <div className="rounded-xl border bg-card/40 p-5 break-inside-avoid">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/5 text-xs font-bold shrink-0 tabular-nums">
          {scene.number}
        </span>
        {scene.intExt && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
              scene.intExt === "INT"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                : "bg-sky-500/15 text-sky-400 border-sky-500/20"
            }`}
          >
            {scene.intExt}
          </span>
        )}
        <span className="text-sm font-semibold flex-1 truncate">
          {scene.slugLine
            .replace(/^(INT|EXT)\.\s*/, "")
            .replace(/\s*-\s*(NIGHT|DAY|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS)\s*$/i, "")}
        </span>
        {scene.timeOfDay && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {scene.timeOfDay}
          </span>
        )}
        {pages && (
          <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
            pp. {pages}
          </span>
        )}
      </div>

      {/* Scene fields */}
      <div>
        {scene.fields
          .filter(
            (f) =>
              f.label !== "Location" &&
              f.label !== "Time" &&
              f.label !== "Characters" &&
              f.label !== "Pages" &&
              f.value &&
              f.value !== "None",
          )
          .map((field) => {
            const isEmphasis =
              field.label === "Key Visual Moment" || field.label === "Emotional Beat";
            if (isEmphasis) {
              return (
                <div key={field.label} className="mb-3">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                    {field.label}
                  </div>
                  <p className="text-[13px] leading-[1.65] text-foreground/85">
                    {field.value}
                  </p>
                </div>
              );
            }
            return (
              <div key={field.label} className="flex gap-3 mb-1.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold shrink-0 w-24 pt-0.5">
                  {field.label}
                </span>
                <span className="text-[11px] text-foreground/75 leading-[1.6] flex-1">
                  {field.value}
                </span>
              </div>
            );
          })}
        {characters && (
          <div className="flex gap-3 mb-1.5">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold shrink-0 w-24 pt-0.5">
              Characters
            </span>
            <span className="text-[11px] text-foreground/75 leading-[1.6] flex-1">
              {characters}
            </span>
          </div>
        )}
      </div>

      {/* Storyboard frame */}
      {storyboard && (
        <div className="mt-4 pt-4 border-t border-border/60 flex gap-4">
          <div className="w-[280px] shrink-0">
            <div className="aspect-video rounded-lg overflow-hidden border border-border/60 bg-muted/30">
              {image?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.url}
                  alt={`Storyboard — Scene ${scene.number}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            {storyboard.camera && (
              <div className="text-[10px]">
                <span className="text-muted-foreground font-mono uppercase tracking-wider mr-2">
                  Camera
                </span>
                <span className="text-foreground/80">{storyboard.camera}</span>
              </div>
            )}
            {storyboard.lighting && (
              <div className="text-[10px]">
                <span className="text-muted-foreground font-mono uppercase tracking-wider mr-2">
                  Lighting
                </span>
                <span className="text-foreground/80">{storyboard.lighting}</span>
              </div>
            )}
            {storyboard.mood && (
              <div className="text-[10px]">
                <span className="text-muted-foreground font-mono uppercase tracking-wider mr-2">
                  Mood
                </span>
                <span className="text-foreground/80">{storyboard.mood}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        .no-print {
          display: none !important;
        }
        .shareable-page {
          padding: 0.5in !important;
          max-width: none !important;
        }
        body {
          background: white !important;
        }
        .break-inside-avoid {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        @page {
          margin: 0.4in;
          size: letter;
        }
      }
    `}</style>
  );
}
