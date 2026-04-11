"use client";

import { useState, useMemo, useRef } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  ImageIcon,
  Loader2,
  RefreshCw,
  Copy,
  FileText,
  Download,
  Images,
} from "lucide-react";
import { parseStoryboardPrompts, type StoryboardScene } from "./storyboard-viewer";
import { SectionHead } from "@/components/ui/section-head";
import type { SavedImage } from "@/lib/reports";

type ImageState = { status: "idle" | "generating" | "done" | "error"; url?: string; error?: string };

export type Scene = {
  number: number;
  slugLine: string;
  intExt: "INT" | "EXT" | "";
  timeOfDay: string;
  fields: { label: string; value: string }[];
};

type Overview = { label: string; value: string }[];

export function parseSceneBreakdown(md: string): { title: string; overview: Overview; scenes: Scene[] } {
  const lines = md.split("\n");
  let title = "";
  const overview: Overview = [];
  const scenes: Scene[] = [];
  let current: Scene | null = null;

  for (const line of lines) {
    if (/^# /.test(line) && !title) {
      title = line.replace(/^# (Scene Breakdown:\s*)?/, "").trim();
      continue;
    }

    const sceneMatch = line.match(/^### Scene (\d+):\s*(.+)/);
    if (sceneMatch) {
      if (current) scenes.push(current);
      const slugLine = sceneMatch[2].trim();
      const intExtMatch = slugLine.match(/^(INT|EXT)\b/i);
      const timeMatch = slugLine.match(/- (NIGHT|DAY|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS)\s*$/i);
      current = {
        number: parseInt(sceneMatch[1]),
        slugLine,
        intExt: intExtMatch ? (intExtMatch[1].toUpperCase() as "INT" | "EXT") : "",
        timeOfDay: timeMatch ? timeMatch[1] : "",
        fields: [],
      };
      continue;
    }

    const fieldMatch = line.match(/^- \*\*(.+?):\*\*\s*(.+)/);
    if (fieldMatch) {
      if (current) {
        current.fields.push({ label: fieldMatch[1], value: fieldMatch[2] });
      } else {
        overview.push({ label: fieldMatch[1], value: fieldMatch[2] });
      }
      continue;
    }

    const overviewMatch = line.match(/^- (.+?):\s*(.+)/);
    if (overviewMatch && !current) {
      overview.push({ label: overviewMatch[1].replace(/\*\*/g, ""), value: overviewMatch[2] });
    }
  }
  if (current) scenes.push(current);

  return { title, overview, scenes };
}

function scenesToMarkdown(title: string, overview: Overview, scenes: Scene[]): string {
  let md = `# Scene Breakdown: ${title}\n\n`;
  for (const item of overview) {
    md += `- **${item.label}:** ${item.value}\n`;
  }
  md += "\n";
  for (const scene of scenes) {
    md += `### Scene ${scene.number}: ${scene.slugLine}\n`;
    for (const field of scene.fields) {
      md += `- **${field.label}:** ${field.value}\n`;
    }
    md += "\n";
  }
  return md;
}

const INT_EXT_STYLES = {
  INT: "bg-amber-500/15 text-amber-400",
  EXT: "bg-sky-500/15 text-sky-400",
  "": "bg-muted text-muted-foreground",
};

const TIME_STYLES: Record<string, string> = {
  NIGHT: "bg-indigo-500/15 text-indigo-300",
  DAY: "bg-yellow-500/15 text-yellow-300",
  MORNING: "bg-orange-500/15 text-orange-300",
  AFTERNOON: "bg-amber-500/15 text-amber-300",
  EVENING: "bg-purple-500/15 text-purple-300",
  DAWN: "bg-pink-500/15 text-pink-300",
  DUSK: "bg-violet-500/15 text-violet-300",
};

const EMPHASIS_FIELDS = new Set(["Key Visual Moment", "Emotional Beat"]);
const SKIP_FIELDS = new Set(["Location", "Time"]);

function SceneEditForm({
  scene,
  onSave,
  onCancel,
}: {
  scene: Scene;
  onSave: (updated: Scene) => void;
  onCancel: () => void;
}) {
  const [slugLine, setSlugLine] = useState(scene.slugLine);
  const [fields, setFields] = useState(scene.fields.map((f) => ({ ...f })));

  const updateField = (index: number, value: string) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], value };
    setFields(updated);
  };

  const handleSave = () => {
    const intExtMatch = slugLine.match(/^(INT|EXT)\b/i);
    const timeMatch = slugLine.match(/- (NIGHT|DAY|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS)\s*$/i);
    onSave({
      ...scene,
      slugLine,
      intExt: intExtMatch ? (intExtMatch[1].toUpperCase() as "INT" | "EXT") : "",
      timeOfDay: timeMatch ? timeMatch[1] : "",
      fields,
    });
  };

  return (
    <div className="px-5 pb-5 pt-4 border-t border-border/60 space-y-3">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 block">
          Slug Line
        </label>
        <input
          value={slugLine}
          onChange={(e) => setSlugLine(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {fields.map((field, i) => (
        <div key={field.label}>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 block">
            {field.label}
          </label>
          {field.value.length > 60 ? (
            <textarea
              value={field.value}
              onChange={(e) => updateField(i, e.target.value)}
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          ) : (
            <input
              value={field.value}
              onChange={(e) => updateField(i, e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Check size={12} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    </div>
  );
}

type SceneBreakdownViewerProps = {
  content: string;
  onContentChange?: (newContent: string) => void;
  storyboardContent?: string | null;
  storyboardImages?: Record<number, SavedImage>;
  onStoryboardImagesChange?: (images: Record<number, SavedImage>) => void;
  promptOverrides?: Record<number, string>;
  onPromptOverridesChange?: (overrides: Record<number, string>) => void;
};

export function SceneBreakdownViewer({
  content,
  onContentChange,
  storyboardContent,
  storyboardImages,
  onStoryboardImagesChange,
  promptOverrides,
  onPromptOverridesChange,
}: SceneBreakdownViewerProps) {
  const parsed = useMemo(() => parseSceneBreakdown(content), [content]);
  const [groupBy, setGroupBy] = useState<"sequence" | "location">("sequence");
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(() => new Set([1]));
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editingPromptScene, setEditingPromptScene] = useState<number | null>(null);
  const [showingPromptScene, setShowingPromptScene] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<Record<number, ImageState>>({});
  const [regenPromptStates, setRegenPromptStates] = useState<Record<number, "idle" | "loading">>({});
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [genAllProgress, setGenAllProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  // Build a lookup from scene number → storyboard scene for fast per-card access.
  const storyboardByNumber = useMemo((): Record<number, StoryboardScene> => {
    if (!storyboardContent) return {};
    const { acts } = parseStoryboardPrompts(storyboardContent);
    const out: Record<number, StoryboardScene> = {};
    for (const act of acts) {
      for (const s of act.scenes) out[s.number] = s;
    }
    return out;
  }, [storyboardContent]);

  // Merge saved images with local (generating/error) state
  const mergedImages = useMemo((): Record<number, ImageState> => {
    const merged: Record<number, ImageState> = {};
    for (const [k, v] of Object.entries(storyboardImages || {})) {
      merged[Number(k)] = v as ImageState;
    }
    for (const [k, v] of Object.entries(localImages)) {
      merged[Number(k)] = v;
    }
    return merged;
  }, [storyboardImages, localImages]);

  const resolveStoryboardScene = (sceneNumber: number): StoryboardScene | null => {
    const base = storyboardByNumber[sceneNumber];
    if (!base) return null;
    const override = promptOverrides?.[sceneNumber];
    return override ? { ...base, prompt: override } : base;
  };

  const generateImage = async (sceneNumber: number) => {
    const sb = resolveStoryboardScene(sceneNumber);
    if (!sb || !onStoryboardImagesChange || !storyboardImages) return;
    setLocalImages((prev) => ({ ...prev, [sceneNumber]: { status: "generating" } }));
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: sb.prompt, camera: sb.camera }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      setLocalImages((prev) => ({ ...prev, [sceneNumber]: { status: "done", url } }));
      onStoryboardImagesChange({ ...storyboardImages, [sceneNumber]: { status: "done", url } });
    } catch (error) {
      setLocalImages((prev) => ({
        ...prev,
        [sceneNumber]: {
          status: "error",
          error: error instanceof Error ? error.message : "Failed",
        },
      }));
    }
  };

  const generateAllImages = async () => {
    if (!onStoryboardImagesChange || !storyboardImages) return;
    const toGenerate = parsed.scenes.filter(
      (s) => storyboardByNumber[s.number] && !storyboardImages[s.number],
    );
    if (toGenerate.length === 0) return;

    cancelRef.current = false;
    setGeneratingAll(true);
    setGenAllProgress({ done: 0, total: toGenerate.length });

    let accumulated = { ...storyboardImages };

    for (let i = 0; i < toGenerate.length; i++) {
      if (cancelRef.current) break;
      const scene = toGenerate[i];
      const sb = resolveStoryboardScene(scene.number);
      if (!sb) continue;

      setLocalImages((prev) => ({ ...prev, [scene.number]: { status: "generating" } }));
      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: sb.prompt, camera: sb.camera }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { url } = await res.json();
        setLocalImages((prev) => ({ ...prev, [scene.number]: { status: "done", url } }));
        accumulated = { ...accumulated, [scene.number]: { status: "done" as const, url } };
        onStoryboardImagesChange(accumulated);
      } catch {
        setLocalImages((prev) => ({
          ...prev,
          [scene.number]: { status: "error", error: "Failed" },
        }));
      }
      setGenAllProgress({ done: i + 1, total: toGenerate.length });
    }
    setGeneratingAll(false);
  };

  const regenPrompt = async (sceneNumber: number) => {
    const sb = resolveStoryboardScene(sceneNumber);
    if (!sb || !onPromptOverridesChange) return;
    setRegenPromptStates((prev) => ({ ...prev, [sceneNumber]: "loading" }));
    try {
      const res = await fetch("/api/regenerate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: sb.prompt, slugLine: sb.slugLine }),
      });
      if (!res.ok) throw new Error("Failed");
      const { prompt } = await res.json();
      onPromptOverridesChange({ ...(promptOverrides || {}), [sceneNumber]: prompt });
    } catch {
      // silently fail
    }
    setRegenPromptStates((prev) => ({ ...prev, [sceneNumber]: "idle" }));
  };

  const savePromptEdit = (sceneNumber: number, newPrompt: string) => {
    if (!onPromptOverridesChange) return;
    onPromptOverridesChange({ ...(promptOverrides || {}), [sceneNumber]: newPrompt });
    setEditingPromptScene(null);
  };

  const copyPrompt = async (sceneNumber: number) => {
    const sb = resolveStoryboardScene(sceneNumber);
    if (!sb) return;
    await navigator.clipboard.writeText(sb.prompt);
    setCopiedScene(sceneNumber);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  const { title, overview, scenes } = parsed;

  const toggleScene = (num: number) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const expandAll = () => setExpandedScenes(new Set(scenes.map((s) => s.number)));
  const collapseAll = () => setExpandedScenes(new Set());

  const handleEditSave = (updated: Scene) => {
    if (!onContentChange) return;
    const newScenes = scenes.map((s) => (s.number === updated.number ? updated : s));
    onContentChange(scenesToMarkdown(title, overview, newScenes));
    setEditingScene(null);
  };

  const handleDeleteScene = (num: number) => {
    if (!onContentChange) return;
    const newScenes = scenes.filter((s) => s.number !== num);
    onContentChange(scenesToMarkdown(title, overview, newScenes));
  };

  // Group scenes by location (lowercase key), ordered by first appearance.
  // Each group's scenes remain in their original sequence order.
  const locationGroups = useMemo(() => {
    const order: string[] = [];
    const groups = new Map<string, Scene[]>();
    for (const scene of scenes) {
      const locationField = scene.fields.find((f) => f.label === "Location")?.value || "";
      const key = locationField.trim().toLowerCase() || "(unknown)";
      if (!groups.has(key)) {
        order.push(key);
        groups.set(key, []);
      }
      groups.get(key)!.push(scene);
    }
    return order.map((key) => ({
      label: key,
      scenes: groups.get(key)!,
    }));
  }, [scenes]);

  const handleAddScene = () => {
    if (!onContentChange) return;
    const maxNum = scenes.length > 0 ? Math.max(...scenes.map((s) => s.number)) : 0;
    const newScene: Scene = {
      number: maxNum + 1,
      slugLine: "INT. NEW LOCATION - DAY",
      intExt: "INT",
      timeOfDay: "DAY",
      fields: [
        { label: "Location", value: "" },
        { label: "Characters", value: "" },
        { label: "Pages", value: "" },
        { label: "Key Visual Moment", value: "" },
        { label: "Emotional Beat", value: "" },
        { label: "Props", value: "" },
        { label: "Wardrobe", value: "" },
        { label: "VFX/Stunts", value: "" },
        { label: "Notes", value: "" },
      ],
    };
    const newScenes = [...scenes, newScene];
    onContentChange(scenesToMarkdown(title, overview, newScenes));
    setExpandedScenes((prev) => new Set([...prev, newScene.number]));
    setEditingScene(newScene.number);
  };

  return (
    <div className="max-w-4xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          {title || "Scenes"}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Scene-by-scene map of the film. Expand any scene to see its key visual moment, characters, and production notes.
        </p>
      </header>

      {overview.length > 0 && (
        <section>
          <SectionHead index={1}>At a Glance</SectionHead>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-[4px] overflow-hidden">
            {overview.map((item) => (
              <div
                key={item.label}
                className="bg-background px-5 py-5 flex flex-col gap-2"
              >
                <div className="text-[32px] font-semibold text-foreground tabular-nums leading-none tracking-tight">
                  {item.value}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground leading-snug">
                  {item.label.replace(/^Total\s+/, "")}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHead
          index={2}
          meta={
            <div className="flex items-center gap-1">
              <div className="inline-flex items-center rounded-md border border-border p-0.5 mr-2">
                <button
                  onClick={() => setGroupBy("sequence")}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                    groupBy === "sequence"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sequence
                </button>
                <button
                  onClick={() => setGroupBy("location")}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                    groupBy === "location"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Location
                </button>
              </div>
              {storyboardContent && onStoryboardImagesChange && (
                generatingAll ? (
                  <button
                    onClick={() => { cancelRef.current = true; }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive px-2 py-1 rounded-md border border-destructive/30 hover:bg-destructive/5 transition-colors mr-1"
                  >
                    <Loader2 size={12} className="animate-spin" />
                    {genAllProgress.done}/{genAllProgress.total} · Cancel
                  </button>
                ) : (
                  <button
                    onClick={generateAllImages}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border hover:border-foreground/20 transition-colors mr-1"
                  >
                    <Images size={12} />
                    Generate all frames
                  </button>
                )
              )}
              {onContentChange && (
                <button
                  onClick={handleAddScene}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border hover:border-foreground/20 transition-colors mr-1"
                >
                  <Plus size={12} />
                  Add scene
                </button>
              )}
              <button
                onClick={expandAll}
                className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
              >
                Expand all
              </button>
              <span className="text-muted-foreground/30">|</span>
              <button
                onClick={collapseAll}
                className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
              >
                Collapse all
              </button>
            </div>
          }
        >
          Scenes
        </SectionHead>

        {(() => {
          const renderScene = (scene: Scene) => {
            const isExpanded = expandedScenes.has(scene.number);
            const isEditing = editingScene === scene.number;
            const characters = scene.fields.find((f) => f.label === "Characters")?.value || "";
            const location = scene.fields.find((f) => f.label === "Location")?.value || "";
            const pages = scene.fields.find((f) => f.label === "Pages")?.value || "";

            return (
              <div
                key={scene.number}
                className={`rounded-[10px] border transition-colors ${
                  isExpanded
                    ? "bg-card/60 border-border"
                    : "bg-card/30 border-border/60 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleScene(scene.number)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-muted font-mono text-[11px] font-semibold shrink-0 tabular-nums">
                      {scene.number.toString().padStart(2, "0")}
                    </span>
                    {scene.intExt && (
                      <span className={`font-mono text-[10px] font-semibold tracking-[0.08em] px-2 py-[3px] rounded-[4px] ${INT_EXT_STYLES[scene.intExt]}`}>
                        {scene.intExt}
                      </span>
                    )}
                    <span className="text-[14px] font-semibold tracking-wide uppercase flex-1 truncate">
                      {scene.slugLine.replace(/^(INT|EXT)\.\s*/, "").replace(/\s*-\s*(NIGHT|DAY|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS)\s*$/i, "")}
                    </span>
                    {scene.timeOfDay && (
                      <span className={`font-mono text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-[3px] rounded-[4px] ${TIME_STYLES[scene.timeOfDay.toUpperCase()] || "bg-muted text-muted-foreground"}`}>
                        {scene.timeOfDay}
                      </span>
                    )}
                    {pages && (
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">pp. {pages}</span>
                    )}
                  </button>

                  {onContentChange && isExpanded && !isEditing && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setEditingScene(scene.number)}
                        className="text-muted-foreground/50 hover:text-foreground p-1 rounded transition-colors"
                        title="Edit scene"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteScene(scene.number)}
                        className="text-muted-foreground/50 hover:text-destructive p-1 rounded transition-colors"
                        title="Delete scene"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={`shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {isExpanded && isEditing && (
                  <SceneEditForm
                    scene={scene}
                    onSave={handleEditSave}
                    onCancel={() => setEditingScene(null)}
                  />
                )}

                {isExpanded && !isEditing && (
                  <div className="px-5 pb-6 pt-5 border-t border-border/60 space-y-5">
                    {(location || characters) && (
                      <div className="flex flex-wrap gap-1.5">
                        {location && (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-muted border border-border/60 rounded-md px-2.5 py-1 text-foreground/85">
                            <span className="text-muted-foreground">◉</span>
                            {location}
                          </span>
                        )}
                        {characters && characters.split(",").map((char) => (
                          <span key={char.trim()} className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-muted border border-border/60 rounded-md px-2.5 py-1 text-foreground/85">
                            <span className="text-muted-foreground">◉</span>
                            {char.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {(() => {
                      const emphasisFields = scene.fields.filter(
                        (f) => EMPHASIS_FIELDS.has(f.label) && f.value && f.value !== "None",
                      );
                      const detailFields = scene.fields.filter(
                        (f) =>
                          !SKIP_FIELDS.has(f.label) &&
                          f.label !== "Characters" &&
                          f.label !== "Pages" &&
                          !EMPHASIS_FIELDS.has(f.label) &&
                          f.value &&
                          f.value !== "None" &&
                          f.value.trim(),
                      );
                      return (
                        <>
                          {emphasisFields.map((field) => (
                            <div key={field.label}>
                              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                                {field.label}
                              </div>
                              <p className="text-[14px] leading-[1.6] text-foreground/90">
                                {field.value}
                              </p>
                            </div>
                          ))}

                          {detailFields.length > 0 && (
                            <dl className="grid grid-cols-[110px_1fr] gap-x-5 gap-y-3 pt-4 border-t border-border/60">
                              {detailFields.map((field) => (
                                <div key={field.label} className="contents">
                                  <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground pt-0.5">
                                    {field.label}
                                  </dt>
                                  <dd className="m-0 text-[13px] leading-[1.55] text-foreground/85">
                                    {field.value}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </>
                      );
                    })()}

                    {/* Storyboard frame — inline with the rest of the scene */}
                    {storyboardByNumber[scene.number] && (
                      <StoryboardSection
                        sceneNumber={scene.number}
                        storyboard={resolveStoryboardScene(scene.number)!}
                        imageState={mergedImages[scene.number] || { status: "idle" }}
                        onGenerate={() => generateImage(scene.number)}
                        onRegenPrompt={() => regenPrompt(scene.number)}
                        onCopyPrompt={() => copyPrompt(scene.number)}
                        onSavePromptEdit={(p) => savePromptEdit(scene.number, p)}
                        isEditingPrompt={editingPromptScene === scene.number}
                        onStartEditPrompt={() => setEditingPromptScene(scene.number)}
                        onCancelEditPrompt={() => setEditingPromptScene(null)}
                        isShowingPrompt={showingPromptScene === scene.number}
                        onToggleShowPrompt={() =>
                          setShowingPromptScene((v) => (v === scene.number ? null : scene.number))
                        }
                        regenState={regenPromptStates[scene.number] || "idle"}
                        isCopied={copiedScene === scene.number}
                        generatingAll={generatingAll}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          };

          if (groupBy === "location") {
            return (
              <div className="space-y-8">
                {locationGroups.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/80 capitalize">
                        {group.label}
                      </h3>
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {group.scenes.length}{" "}
                        {group.scenes.length === 1 ? "scene" : "scenes"}
                      </span>
                    </div>
                    <div className="space-y-2">{group.scenes.map(renderScene)}</div>
                  </div>
                ))}
              </div>
            );
          }

          return <div className="space-y-2">{scenes.map(renderScene)}</div>;
        })()}
      </section>
    </div>
  );
}

type StoryboardSectionProps = {
  sceneNumber: number;
  storyboard: StoryboardScene;
  imageState: ImageState;
  onGenerate: () => void;
  onRegenPrompt: () => void;
  onCopyPrompt: () => void;
  onSavePromptEdit: (newPrompt: string) => void;
  isEditingPrompt: boolean;
  onStartEditPrompt: () => void;
  onCancelEditPrompt: () => void;
  isShowingPrompt: boolean;
  onToggleShowPrompt: () => void;
  regenState: "idle" | "loading";
  isCopied: boolean;
  generatingAll: boolean;
};

function StoryboardSection({
  sceneNumber,
  storyboard,
  imageState,
  onGenerate,
  onRegenPrompt,
  onCopyPrompt,
  onSavePromptEdit,
  isEditingPrompt,
  onStartEditPrompt,
  onCancelEditPrompt,
  isShowingPrompt,
  onToggleShowPrompt,
  regenState,
  isCopied,
  generatingAll,
}: StoryboardSectionProps) {
  const [editText, setEditText] = useState(storyboard.prompt);
  // Keep editText in sync if the prompt changes externally (e.g., rewrite)
  // without fighting the textarea when the user is actively editing.
  useMemo(() => {
    if (!isEditingPrompt) setEditText(storyboard.prompt);
  }, [storyboard.prompt, isEditingPrompt]);

  const promptVisible = isEditingPrompt || isShowingPrompt;

  return (
    <div className="pt-5 mt-1 border-t border-border/60">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
        Storyboard Frame
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
        {/* Left: image or placeholder + action link row */}
        <div>
          {imageState.status === "done" && imageState.url ? (
            <div className="relative group aspect-video rounded-md overflow-hidden border border-border/60 bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageState.url}
                alt={`Storyboard frame — Scene ${sceneNumber}`}
                className="w-full h-full object-cover"
              />
              <a
                href={imageState.url}
                download={`scene-${sceneNumber}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 font-mono text-[10px] px-2 py-1 rounded bg-black/70 text-white hover:bg-black/90"
              >
                <Download size={10} />
                Save
              </a>
            </div>
          ) : imageState.status === "generating" ? (
            <div className="aspect-video rounded-md border border-border/60 bg-muted/20 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Generating frame…
            </div>
          ) : imageState.status === "error" ? (
            <div className="aspect-video rounded-md border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-1 text-[11px] text-destructive/80">
              <span>{imageState.error || "Generation failed"}</span>
              <button
                onClick={onGenerate}
                className="underline underline-offset-2 hover:text-destructive"
              >
                Retry
              </button>
            </div>
          ) : (
            <button
              onClick={onGenerate}
              disabled={generatingAll}
              className="aspect-video w-full rounded-md border border-dashed border-border/80 bg-muted/10 hover:bg-muted/20 hover:border-foreground/30 flex flex-col items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ImageIcon size={18} />
              Generate frame
            </button>
          )}

          {/* Action row — mono underline links */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 font-mono text-[10px]">
            {imageState.status === "done" && (
              <FrameLink
                icon={<RefreshCw size={11} />}
                label="Regenerate image"
                onClick={onGenerate}
              />
            )}
            <FrameLink
              icon={
                regenState === "loading" ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <RefreshCw size={11} />
                )
              }
              label={regenState === "loading" ? "Rewriting…" : "Rewrite prompt"}
              onClick={onRegenPrompt}
              disabled={regenState === "loading" || isEditingPrompt}
            />
            <FrameLink
              icon={<FileText size={11} />}
              label={isEditingPrompt ? "Editing…" : "Edit prompt"}
              onClick={isEditingPrompt ? onCancelEditPrompt : onStartEditPrompt}
              active={isEditingPrompt}
            />
            <FrameLink
              icon={isCopied ? <Check size={11} /> : <Copy size={11} />}
              label={isCopied ? "Copied" : "Copy prompt"}
              onClick={onCopyPrompt}
            />
          </div>
        </div>

        {/* Right: metadata as a dl + show prompt link */}
        <div className="min-w-0">
          {(storyboard.camera || storyboard.lighting || storyboard.mood) && (
            <dl className="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
              {storyboard.camera && <Meta label="Camera" value={storyboard.camera} />}
              {storyboard.lighting && <Meta label="Lighting" value={storyboard.lighting} />}
              {storyboard.mood && <Meta label="Mood" value={storyboard.mood} />}
            </dl>
          )}

          {!isEditingPrompt && !isShowingPrompt && (
            <button
              onClick={onToggleShowPrompt}
              className="mt-4 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-[3px] decoration-border"
            >
              Show prompt →
            </button>
          )}

          {promptVisible && (
            <div className="mt-4">
              {isEditingPrompt ? (
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
                      onClick={() => onSavePromptEdit(editText)}
                      className="text-[11px] font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={onCancelEditPrompt}
                      className="text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-mono text-[11px] leading-[1.65] text-foreground/75 bg-muted/20 rounded-md p-3 border border-border/40">
                    {storyboard.prompt}
                  </p>
                  <button
                    onClick={onToggleShowPrompt}
                    className="mt-2 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-[3px] decoration-border"
                  >
                    Hide prompt
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FrameLink({
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
      onClick={onClick}
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground pt-0.5">
        {label}
      </dt>
      <dd className="m-0 text-[13px] leading-[1.55] text-foreground/85">{value}</dd>
    </>
  );
}

