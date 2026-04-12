"use client";

import { useState, useMemo, useRef } from "react";
import { ImageIcon, Loader2, Download, Images, RefreshCw, FileText, Copy, Check } from "lucide-react";
import { getStylePrefix } from "@/lib/image-prompts";

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

export function parsePosterConcepts(md: string): { title: string; intro: string; concepts: PosterConcept[] } {
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
  const [showPrompt, setShowPrompt] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [promptOverrides, setPromptOverrides] = useState<Record<number, string>>({});
  const [regenPromptStates, setRegenPromptStates] = useState<Record<number, "idle" | "loading">>({});
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

  const getPrompt = (concept: PosterConcept) =>
    promptOverrides[concept.number] || concept.aiPrompt;

  const copyAIPrompt = async (concept: PosterConcept) => {
    await navigator.clipboard.writeText(getPrompt(concept));
    setCopiedId(concept.number);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditPrompt = (concept: PosterConcept) => {
    setEditText(getPrompt(concept));
    setEditingPrompt(concept.number);
    setShowPrompt(concept.number);
  };

  const savePromptEdit = (num: number) => {
    setPromptOverrides((prev) => ({ ...prev, [num]: editText }));
    setEditingPrompt(null);
  };

  const rewritePrompt = async (concept: PosterConcept) => {
    setRegenPromptStates((prev) => ({ ...prev, [concept.number]: "loading" }));
    try {
      const res = await fetch("/api/regenerate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: getPrompt(concept),
          slugLine: concept.name,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const { prompt } = await res.json();
      setPromptOverrides((prev) => ({ ...prev, [concept.number]: prompt }));
    } catch {
      // silently fail
    }
    setRegenPromptStates((prev) => ({ ...prev, [concept.number]: "idle" }));
  };

  const toggleConcept = (num: number) => {
    setExpandedConcepts((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  // Fetch one poster image. Caller is responsible for merging into the
  // accumulated saved state — see generateAllPosters for the batch pattern.
  // Avoids the stale-closure bug where sequential spreads would wipe each
  // other's work in the parent.
  const fetchPosterImage = async (concept: PosterConcept): Promise<{ url: string } | null> => {
    setLocalImages((prev) => ({ ...prev, [concept.number]: { status: "generating" } }));
    const prompt = getPrompt(concept) || [
      concept.composition,
      concept.style ? `Style: ${concept.style}.` : "",
    ].filter(Boolean).join(" ");

    try {
      const res = await fetch("/api/generate-poster-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          stylePrefix: getStylePrefix("poster"),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      setLocalImages((prev) => ({ ...prev, [concept.number]: { status: "done", url } }));
      return { url };
    } catch {
      setLocalImages((prev) => ({ ...prev, [concept.number]: { status: "error" } }));
      return null;
    }
  };

  const generatePosterImage = async (concept: PosterConcept) => {
    const result = await fetchPosterImage(concept);
    if (result) {
      onImagesChange({ ...savedImages, [concept.number]: { status: "done", url: result.url } });
    }
  };

  const generateAllPosters = async () => {
    const toGenerate = concepts.filter((c) => !savedImages[c.number]);
    if (toGenerate.length === 0) return;

    cancelRef.current = false;
    setGeneratingAll(true);
    setGenAllProgress({ done: 0, total: toGenerate.length });

    let accumulated: Record<number, SavedImage> = { ...savedImages };

    for (let i = 0; i < toGenerate.length; i++) {
      if (cancelRef.current) break;
      const concept = toGenerate[i];
      const result = await fetchPosterImage(concept);
      if (result) {
        accumulated = { ...accumulated, [concept.number]: { status: "done", url: result.url } };
        onImagesChange(accumulated);
      }
      setGenAllProgress({ done: i + 1, total: toGenerate.length });
    }

    setGeneratingAll(false);
  };

  const expandAll = () =>
    setExpandedConcepts(new Set(concepts.map((c) => c.number)));
  const collapseAll = () => setExpandedConcepts(new Set());

  const missingCount = concepts.filter((c) => !savedImages[c.number]).length;

  return (
    <div>
      {intro && (
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
          {intro}
        </p>
      )}

      <div className="flex items-center gap-1 mb-6">
        <div className="flex-1 h-px bg-border mr-2" />
        <button
          onClick={expandedConcepts.size === concepts.length ? collapseAll : expandAll}
          className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
        >
          {expandedConcepts.size === concepts.length ? "Collapse all" : "Expand all"}
        </button>
        {generatingAll ? (
          <button
            onClick={() => {
              cancelRef.current = true;
            }}
            className="ml-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Loader2 size={13} className="animate-spin" />
            {genAllProgress.done}/{genAllProgress.total} — Cancel
          </button>
        ) : (
          missingCount > 0 && (
            <button
              onClick={generateAllPosters}
              className="ml-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Images size={13} />
              Generate {missingCount === concepts.length ? "all" : `${missingCount} missing`} posters
            </button>
          )
        )}
      </div>

      {categories.map((category) => {
        const categoryConcepts = concepts.filter((c) => c.category === category);
        return (
          <section key={category} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
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
                  <div key={concept.number} className="rounded-[12px] shadow-paper bg-card/40 overflow-hidden">
                    {/* Header */}
                    <button
                      onClick={() => toggleConcept(concept.number)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-white/[0.04] shadow-pill text-[11px] font-mono font-medium tabular-nums shrink-0 text-foreground/90">
                        {concept.number.toString().padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium tracking-tight">{concept.name}</span>
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
                        {/* Generated poster sketch + details side by side */}
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

                          {/* Details column */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {concept.tagline && (
                              <blockquote className="text-[15px] font-medium italic border-l-2 border-primary/30 pl-3 text-foreground/85">
                                &ldquo;{concept.tagline}&rdquo;
                              </blockquote>
                            )}
                            {concept.style && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Style</div>
                                <p className="text-[13px] text-foreground/75 leading-relaxed">{concept.style}</p>
                              </div>
                            )}
                            {concept.composition && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Composition</div>
                                <p className="text-[13px] text-foreground/75 leading-relaxed">{concept.composition}</p>
                              </div>
                            )}

                            {/* Prompt action links — inline row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px]">
                              {posterImages[concept.number]?.status === "done" && (
                                <PosterLink
                                  icon={<RefreshCw size={11} />}
                                  label="Regenerate image"
                                  onClick={() => generatePosterImage(concept)}
                                />
                              )}
                              <PosterLink
                                icon={
                                  regenPromptStates[concept.number] === "loading"
                                    ? <Loader2 size={11} className="animate-spin" />
                                    : <RefreshCw size={11} />
                                }
                                label={regenPromptStates[concept.number] === "loading" ? "Rewriting…" : "Rewrite prompt"}
                                onClick={() => rewritePrompt(concept)}
                                disabled={regenPromptStates[concept.number] === "loading" || editingPrompt === concept.number}
                              />
                              <PosterLink
                                icon={<FileText size={11} />}
                                label={editingPrompt === concept.number ? "Editing…" : "Edit prompt"}
                                onClick={() => editingPrompt === concept.number ? setEditingPrompt(null) : startEditPrompt(concept)}
                                active={editingPrompt === concept.number}
                              />
                              <PosterLink
                                icon={isCopied ? <Check size={11} /> : <Copy size={11} />}
                                label={isCopied ? "Copied" : "Copy prompt"}
                                onClick={() => copyAIPrompt(concept)}
                              />
                              {concept.aiPrompt && editingPrompt !== concept.number && showPrompt !== concept.number && (
                                <PosterLink
                                  icon={<FileText size={11} />}
                                  label="Show prompt"
                                  onClick={() => setShowPrompt(concept.number)}
                                />
                              )}
                            </div>
                            {editingPrompt === concept.number && (
                              <div className="space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full font-mono text-[12px] leading-[1.7] text-foreground/85 bg-muted/30 border border-border/60 rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                  rows={Math.max(3, editText.split("\n").length + 1)}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); savePromptEdit(concept.number); }}
                                    className="text-[11px] font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingPrompt(null); }}
                                    className="text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            {showPrompt === concept.number && editingPrompt !== concept.number && (
                              <div>
                                <p className="font-mono text-[11px] leading-[1.65] text-foreground/75 bg-muted/20 rounded-md p-3 border border-border/40">
                                  {getPrompt(concept)}
                                </p>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowPrompt(null); }}
                                  className="mt-2 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-[3px] decoration-border"
                                >
                                  Hide prompt
                                </button>
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

function PosterLink({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="underline underline-offset-[3px] decoration-border">{label}</span>
    </button>
  );
}
