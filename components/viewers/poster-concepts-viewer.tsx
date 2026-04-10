"use client";

import { useState, useMemo, useRef } from "react";
import { ImageIcon, Loader2, Download, Images } from "lucide-react";

type PosterImageState = { status: "idle" | "generating" | "done" | "error"; url?: string };

type PosterConcept = {
  number: number;
  name: string;
  category: string;
  style: string;
  composition: string;
  colors: { hex: string; name?: string }[];
  typography: string;
  tagline: string;
  mood: string;
  targetAppeal: string;
  aiPrompt: string;
};

function parsePosterConcepts(md: string): { title: string; intro: string; concepts: PosterConcept[] } {
  const lines = md.split("\n");
  let title = "";
  let intro = "";
  const concepts: PosterConcept[] = [];
  let currentCategory = "";
  let current: PosterConcept | null = null;
  let conceptNum = 0;

  const flushConcept = () => {
    if (current) concepts.push(current);
    current = null;
  };

  for (const line of lines) {
    if (/^# /.test(line) && !title) {
      title = line.replace(/^# (Poster Concepts:\s*)?/, "").trim();
      continue;
    }

    // Intro section
    if (/^## About/.test(line)) continue;
    if (!currentCategory && !line.startsWith("##") && !line.startsWith("**Concept") && line.trim() && !line.startsWith("---")) {
      intro += line.trim() + " ";
      continue;
    }

    // Category heading: ## Category: Name
    const catMatch = line.match(/^## Category:\s*(.+)/);
    if (catMatch) {
      flushConcept();
      currentCategory = catMatch[1].trim();
      continue;
    }

    // Concept heading: **Concept N: Name**
    const conceptMatch = line.match(/\*\*Concept (\d+):\s*(.+?)\*\*/);
    if (conceptMatch) {
      flushConcept();
      conceptNum = parseInt(conceptMatch[1]);
      current = {
        number: conceptNum,
        name: conceptMatch[2].trim(),
        category: currentCategory,
        style: "",
        composition: "",
        colors: [],
        typography: "",
        tagline: "",
        mood: "",
        targetAppeal: "",
        aiPrompt: "",
      };
      continue;
    }

    if (!current) continue;

    // Fields: - **Field:** Value
    const fieldMatch = line.match(/^- \*\*(.+?):\*\*\s*(.+)/);
    if (fieldMatch) {
      const key = fieldMatch[1].toLowerCase();
      const val = fieldMatch[2].trim();

      if (key === "style") current.style = val;
      else if (key === "composition") current.composition = val;
      else if (key.includes("color")) {
        // Parse color palette: #hex (name), #hex (name)
        const hexMatches = val.matchAll(/(#[0-9a-fA-F]{6})\s*(?:\(([^)]+)\))?/g);
        for (const m of hexMatches) {
          current.colors.push({ hex: m[1], name: m[2] || undefined });
        }
      } else if (key.includes("typograph")) current.typography = val;
      else if (key === "tagline") current.tagline = val.replace(/^[""]|[""]$/g, "");
      else if (key === "mood") current.mood = val;
      else if (key.includes("target")) current.targetAppeal = val;
      else if (key.includes("ai prompt")) current.aiPrompt = val.replace(/^[""]|[""]$/g, "");
    }
  }
  flushConcept();

  return { title, intro: intro.trim(), concepts };
}

type SavedImage = { status: "done"; url: string };

type PosterConceptsViewerProps = {
  content: string;
  savedImages: Record<number, SavedImage>;
  onImagesChange: (images: Record<number, SavedImage>) => void;
};

export function PosterConceptsViewer({ content, savedImages, onImagesChange }: PosterConceptsViewerProps) {
  const { title, intro, concepts } = useMemo(() => parsePosterConcepts(content), [content]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedConcepts, setExpandedConcepts] = useState<Set<number>>(() => new Set([1]));
  const [localImages, setLocalImages] = useState<Record<number, PosterImageState>>({});
  const [generatingAll, setGeneratingAll] = useState(false);
  const [genAllProgress, setGenAllProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  // Merge saved + local images
  const posterImages: Record<number, PosterImageState> = useMemo(() => {
    const merged: Record<number, PosterImageState> = {};
    for (const [k, v] of Object.entries(savedImages)) {
      merged[Number(k)] = v;
    }
    for (const [k, v] of Object.entries(localImages)) {
      merged[Number(k)] = v;
    }
    return merged;
  }, [savedImages, localImages]);

  const categories = [...new Set(concepts.map((c) => c.category))];

  const copyAIPrompt = async (concept: PosterConcept) => {
    await navigator.clipboard.writeText(concept.aiPrompt);
    setCopiedId(concept.number);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleConcept = (num: number) => {
    setExpandedConcepts((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const generatePosterImage = async (concept: PosterConcept) => {
    setLocalImages((prev) => ({ ...prev, [concept.number]: { status: "generating" } }));
    const prompt = [
      concept.composition,
      concept.style ? `Style: ${concept.style}.` : "",
    ].filter(Boolean).join(" ");

    try {
      const res = await fetch("/api/generate-poster-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      setLocalImages((prev) => ({ ...prev, [concept.number]: { status: "done", url } }));
      onImagesChange({ ...savedImages, [concept.number]: { status: "done", url } });
    } catch {
      setLocalImages((prev) => ({ ...prev, [concept.number]: { status: "error" } }));
    }
  };

  const generateAllPosters = async () => {
    const toGenerate = concepts.filter((c) => !savedImages[c.number]);
    if (toGenerate.length === 0) return;

    cancelRef.current = false;
    setGeneratingAll(true);
    setGenAllProgress({ done: 0, total: toGenerate.length });

    for (let i = 0; i < toGenerate.length; i++) {
      if (cancelRef.current) break;
      await generatePosterImage(toGenerate[i]);
      setGenAllProgress({ done: i + 1, total: toGenerate.length });
    }

    setGeneratingAll(false);
  };

  return (
    <div>
      {intro && (
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
          {intro}
        </p>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        {generatingAll ? (
          <button
            onClick={() => { cancelRef.current = true; }}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Loader2 size={13} className="animate-spin" />
            {genAllProgress.done}/{genAllProgress.total} — Cancel
          </button>
        ) : (
          <button
            onClick={generateAllPosters}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Images size={13} />
            Generate all posters
          </button>
        )}
      </div>

      {categories.map((category) => {
        const categoryConcepts = concepts.filter((c) => c.category === category);
        return (
          <section key={category} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {category}
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">{categoryConcepts.length} concepts</span>
            </div>

            <div className="space-y-3">
              {categoryConcepts.map((concept) => {
                const isExpanded = expandedConcepts.has(concept.number);
                const isCopied = copiedId === concept.number;

                return (
                  <div key={concept.number} className="rounded-xl border overflow-hidden">
                    {/* Header */}
                    <button
                      onClick={() => toggleConcept(concept.number)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/5 text-xs font-bold shrink-0">
                        {concept.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold">{concept.name}</span>
                        {concept.mood && (
                          <span className="text-[11px] text-muted-foreground ml-2">
                            {concept.mood}
                          </span>
                        )}
                      </div>
                      {/* Color strip mini */}
                      {concept.colors.length > 0 && (
                        <div className="flex rounded overflow-hidden h-5 w-20 shrink-0">
                          {concept.colors.map((c, i) => (
                            <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} />
                          ))}
                        </div>
                      )}
                      <svg
                        width="16" height="16" viewBox="0 0 16 16" fill="none"
                        className={`shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4">
                        {/* Generated poster sketch + color strip side by side */}
                        <div className="flex gap-4 mt-3">
                          {/* Poster image or generate button */}
                          <div className="shrink-0 w-[140px]">
                            {posterImages[concept.number]?.status === "done" && posterImages[concept.number]?.url ? (
                              <div className="relative group">
                                <div className="rounded-lg overflow-hidden border bg-muted/30" style={{ aspectRatio: "5/7" }}>
                                  <img
                                    src={posterImages[concept.number].url}
                                    alt={`Poster sketch — ${concept.name}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a
                                    href={posterImages[concept.number].url}
                                    download={`poster-${concept.number}.jpg`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white hover:bg-black/90"
                                  >
                                    <Download size={10} />
                                  </a>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); generatePosterImage(concept); }}
                                  className="w-full mt-1.5 text-[10px] text-muted-foreground hover:text-foreground text-center transition-colors"
                                >
                                  Regenerate
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); generatePosterImage(concept); }}
                                disabled={posterImages[concept.number]?.status === "generating"}
                                className="w-full rounded-lg border-2 border-dashed border-border hover:border-foreground/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                                style={{ aspectRatio: "5/7" }}
                              >
                                {posterImages[concept.number]?.status === "generating" ? (
                                  <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span className="text-[10px] font-medium">Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon size={20} />
                                    <span className="text-[10px] font-medium">Generate sketch</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Color palette + tagline */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Tagline */}
                            {concept.tagline && (
                              <blockquote className="text-[15px] font-medium italic border-l-2 border-primary/30 pl-3 text-foreground/85">
                                &ldquo;{concept.tagline}&rdquo;
                              </blockquote>
                            )}

                            {/* Style */}
                            {concept.style && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Style</div>
                                <p className="text-[13px] text-foreground/75 leading-relaxed">{concept.style}</p>
                              </div>
                            )}

                            {/* Composition */}
                            {concept.composition && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Composition</div>
                                <p className="text-[13px] text-foreground/75 leading-relaxed">{concept.composition}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Color palette strip */}
                        {concept.colors.length > 0 && (
                          <div className="flex rounded-lg overflow-hidden h-10 mt-3">
                            {concept.colors.map((c, i) => (
                              <div
                                key={i}
                                className="flex-1 relative group cursor-default flex items-center justify-center"
                                style={{ backgroundColor: c.hex }}
                                title={`${c.name || ""} ${c.hex}`}
                              >
                                <span className="text-white text-[10px] font-mono font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{c.hex}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Typography */}
                        {concept.typography && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Typography</div>
                            <p className="text-[13px] text-foreground/75 leading-relaxed">{concept.typography}</p>
                          </div>
                        )}

                        {/* Target Appeal */}
                        {concept.targetAppeal && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0 pt-0.5">Audience</span>
                            <span className="text-[12px] text-foreground/60">{concept.targetAppeal}</span>
                          </div>
                        )}

                        {/* AI Prompt with copy */}
                        {concept.aiPrompt && (
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                AI Image Prompt
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyAIPrompt(concept); }}
                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
                                  isCopied
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                              >
                                {isCopied ? (
                                  <>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[12px] font-mono text-foreground/60 leading-relaxed">
                              {concept.aiPrompt}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
