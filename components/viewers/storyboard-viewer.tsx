"use client";

import { useState, useMemo, useRef } from "react";
import { Video, Sun, Heart, Check, Copy, ImageIcon, Loader2, Download, RefreshCw, Images, ChevronDown } from "lucide-react";

type StoryboardScene = {
  number: number;
  slugLine: string;
  prompt: string;
  camera: string;
  lighting: string;
  mood: string;
};

type Act = {
  label: string;
  scenes: StoryboardScene[];
};

function parseStoryboardPrompts(md: string): { title: string; intro: string; acts: Act[] } {
  const lines = md.split("\n");
  let title = "";
  const allScenes: StoryboardScene[] = [];
  const actLabels: { label: string; startIndex: number }[] = [];
  let current: StoryboardScene | null = null;
  let collectingPrompt = false;
  let promptBuffer = "";
  let introBuffer = "";
  let pastIntro = false;
  let sceneIndex = 0;

  for (const line of lines) {
    if (/^# /.test(line) && !title) {
      title = line.replace(/^# (Storyboard Prompts:\s*)?/, "").trim();
      continue;
    }

    // Act heading: ## Act 1: Setup, ## First Act, etc.
    const actMatch = line.match(/^## (.+)/);
    if (actMatch) {
      if (!pastIntro) {
        // Could be intro section heading — skip but capture act label if it looks like one
        const actText = actMatch[1].trim();
        if (/act/i.test(actText)) {
          actLabels.push({ label: actText, startIndex: allScenes.length });
        }
        continue;
      }
      // Act heading after scenes have started — only if it looks like an act label
      const actText = actMatch[1].trim();
      if (/act/i.test(actText)) {
        actLabels.push({ label: actText, startIndex: allScenes.length });
      }
      continue;
    }

    // Scene heading: ### Scene N: SLUG_LINE
    const sceneMatch = line.match(/^### Scene (\d+):\s*(.+)/);
    if (sceneMatch) {
      pastIntro = true;
      if (current) {
        if (collectingPrompt) current.prompt = promptBuffer.trim();
        allScenes.push(current);
        sceneIndex++;
      }
      current = {
        number: parseInt(sceneMatch[1]),
        slugLine: sceneMatch[2].trim(),
        prompt: "",
        camera: "",
        lighting: "",
        mood: "",
      };
      collectingPrompt = false;
      promptBuffer = "";
      continue;
    }

    if (!pastIntro && !current && line.trim() && !line.startsWith("---")) {
      introBuffer += line + " ";
      continue;
    }

    if (!current) continue;

    // Metadata fields
    const cameraMatch = line.match(/\*\*Camera:\*\*\s*(.+)/);
    const lightingMatch = line.match(/\*\*Lighting:\*\*\s*(.+)/);
    const moodMatch = line.match(/\*\*Mood:\*\*\s*(.+)/);

    if (cameraMatch) {
      if (collectingPrompt) { current.prompt = promptBuffer.trim(); collectingPrompt = false; promptBuffer = ""; }
      let camText = cameraMatch[1];
      const inlineLight = camText.match(/\*\*Lighting:\*\*\s*(.+)/);
      if (inlineLight) {
        camText = camText.replace(/\*\*Lighting:\*\*.*/, "").trim();
        let lightText = inlineLight[1];
        const inlineMood = lightText.match(/\*\*Mood:\*\*\s*(.+)/);
        if (inlineMood) {
          lightText = lightText.replace(/\*\*Mood:\*\*.*/, "").trim();
          current.mood = inlineMood[1].trim();
        }
        current.lighting = lightText.trim();
      }
      current.camera = camText.trim();
      continue;
    }
    if (lightingMatch) {
      if (collectingPrompt) { current.prompt = promptBuffer.trim(); collectingPrompt = false; promptBuffer = ""; }
      let lightText = lightingMatch[1];
      const inlineMood = lightText.match(/\*\*Mood:\*\*\s*(.+)/);
      if (inlineMood) {
        lightText = lightText.replace(/\*\*Mood:\*\*.*/, "").trim();
        current.mood = inlineMood[1].trim();
      }
      current.lighting = lightText.trim();
      continue;
    }
    if (moodMatch) {
      if (collectingPrompt) { current.prompt = promptBuffer.trim(); collectingPrompt = false; promptBuffer = ""; }
      current.mood = moodMatch[1].trim();
      continue;
    }

    // Prompt field
    const promptStart = line.match(/\*\*Prompt:\*\*\s*(.*)/);
    if (promptStart) {
      collectingPrompt = true;
      promptBuffer = promptStart[1] + " ";
      continue;
    }

    if (collectingPrompt && line.trim() && !line.startsWith("---")) {
      promptBuffer += line.trim() + " ";
    }
  }

  if (current) {
    if (collectingPrompt) current.prompt = promptBuffer.trim();
    allScenes.push(current);
  }

  // Group scenes into acts
  let acts: Act[];
  if (actLabels.length > 0) {
    // Use parsed act labels with array indices
    acts = actLabels.map((act, i) => {
      const nextStart = actLabels[i + 1]?.startIndex ?? allScenes.length;
      return {
        label: act.label,
        scenes: allScenes.slice(act.startIndex, nextStart),
      };
    });
    // Catch any scenes before the first act label
    const firstStart = actLabels[0].startIndex;
    if (firstStart > 0) {
      acts.unshift({ label: "Prologue", scenes: allScenes.slice(0, firstStart) });
    }
  } else if (allScenes.length > 0) {
    // Fall back to 3-act structure based on scene count
    const total = allScenes.length;
    const act1End = Math.ceil(total * 0.25);
    const act2End = Math.ceil(total * 0.75);
    acts = [
      { label: "First Act — Setup", scenes: allScenes.slice(0, act1End) },
      { label: "Second Act — Confrontation", scenes: allScenes.slice(act1End, act2End) },
      { label: "Third Act — Resolution", scenes: allScenes.slice(act2End) },
    ];
  } else {
    acts = [];
  }

  return { title, intro: introBuffer.trim(), acts };
}

type ImageState = { status: "idle" | "generating" | "done" | "error"; url?: string; error?: string };

function SceneCard({ scene, copiedScene, onCopy, imageState, onGenerate, regenState, onRegenPrompt, onEditPrompt }: {
  scene: StoryboardScene;
  copiedScene: number | null;
  onCopy: (scene: StoryboardScene) => void;
  imageState: ImageState;
  onGenerate: (scene: StoryboardScene) => void;
  regenState: "idle" | "loading";
  onRegenPrompt: (scene: StoryboardScene) => void;
  onEditPrompt: (sceneNumber: number, newPrompt: string) => void;
}) {
  const isCopied = copiedScene === scene.number;
  const intExtMatch = scene.slugLine.match(/^(INT|EXT)\b/i);
  const intExt = intExtMatch ? intExtMatch[1].toUpperCase() : "";
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(scene.prompt);
  // Prompt text is collapsed by default — the storyboard image is the primary
  // artifact, the prompt is the generator input that most viewers won't need.
  const [promptExpanded, setPromptExpanded] = useState(false);
  const isPromptVisible = promptExpanded || editing;

  return (
    <div className="rounded-xl border border-border/60 bg-card/30 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-card/50 border-b border-border/60">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/5 text-xs font-bold shrink-0 tabular-nums">
          {scene.number}
        </span>
        {intExt && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
            intExt === "EXT"
              ? "bg-sky-500/15 text-sky-400 border-sky-500/20"
              : "bg-amber-500/15 text-amber-400 border-amber-500/20"
          }`}>
            {intExt}
          </span>
        )}
        <span className="text-sm font-semibold flex-1">
          {scene.slugLine.replace(/^(INT|EXT)\.\s*/, "")}
        </span>
        <button
          onClick={() => onGenerate(scene)}
          disabled={imageState.status === "generating"}
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
            imageState.status === "generating"
              ? "text-primary border-primary/20 bg-primary/5"
              : imageState.status === "done"
              ? "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent hover:border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent hover:border-border"
          }`}
        >
          {imageState.status === "generating" ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Generating...
            </>
          ) : imageState.status === "done" ? (
            <>
              <ImageIcon size={12} />
              Regenerate
            </>
          ) : (
            <>
              <ImageIcon size={12} />
              Generate image
            </>
          )}
        </button>
        <button
          onClick={() => {
            if (editing) {
              onEditPrompt(scene.number, editText);
              setEditing(false);
            } else {
              setEditText(scene.prompt);
              setEditing(true);
            }
          }}
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
            editing
              ? "bg-primary text-primary-foreground border-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border"
          }`}
        >
          {editing ? "Save" : "Edit prompt"}
        </button>
        <button
          onClick={() => onRegenPrompt(scene)}
          disabled={regenState === "loading" || editing}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={regenState === "loading" ? "animate-spin" : ""} />
          {regenState === "loading" ? "Rewriting..." : "Rewrite prompt"}
        </button>
        <button
          onClick={() => onCopy(scene)}
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
            isCopied
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent hover:border-border"
          }`}
        >
          {isCopied ? (
            <>
              <Check size={12} strokeWidth={2.5} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy prompt
            </>
          )}
        </button>
      </div>

      {imageState.status === "error" && (
        <div className="px-4 py-3 bg-destructive/5 border-b">
          <p className="text-xs text-destructive">{imageState.error || "Image generation failed"}</p>
        </div>
      )}

      {/* Content: text + image side by side when image exists */}
      <div className={`flex gap-4 px-4 py-4 ${imageState.status === "done" && imageState.url ? "" : "flex-col"}`}>
        {/* Text content */}
        <div className="flex-1 min-w-0">
          {/* Metadata chips — always visible, they're compact */}
          {(scene.camera || scene.lighting || scene.mood) && (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {scene.camera && (
                <div className="flex items-center gap-1.5">
                  <Video size={13} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{scene.camera}</span>
                </div>
              )}
              {scene.lighting && (
                <div className="flex items-center gap-1.5">
                  <Sun size={13} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{scene.lighting}</span>
                </div>
              )}
              {scene.mood && (
                <div className="flex items-center gap-1.5">
                  <Heart size={13} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{scene.mood}</span>
                </div>
              )}
            </div>
          )}

          {/* Prompt — collapsed by default */}
          <button
            onClick={() => setPromptExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              size={11}
              className={`transition-transform ${isPromptVisible ? "" : "-rotate-90"}`}
            />
            {isPromptVisible ? "Hide prompt" : "Show prompt"}
          </button>

          {isPromptVisible && (
            <div className="mt-2">
              {editing ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full text-[13px] leading-[1.8] text-foreground/80 bg-muted/30 border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={Math.max(3, editText.split("\n").length + 1)}
                  autoFocus
                />
              ) : (
                <p className="text-[12px] leading-[1.7] text-foreground/70 bg-muted/20 rounded-lg p-3 border border-border/40">
                  {scene.prompt}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Generated image — fixed 16:9 thumbnail to the right */}
        {imageState.status === "done" && imageState.url && (
          <div className="relative group shrink-0 w-[280px]">
            <div className="aspect-video rounded-lg overflow-hidden border bg-muted/30">
              <img
                src={imageState.url}
                alt={`Storyboard frame — Scene ${scene.number}`}
                className="w-full h-full object-cover"
              />
            </div>
            <a
              href={imageState.url}
              download={`scene-${scene.number}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-black/70 text-white hover:bg-black/90"
            >
              <Download size={10} />
              Save
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

type SavedImage = { status: "done"; url: string };

type StoryboardViewerProps = {
  content: string;
  savedImages: Record<number, SavedImage>;
  onImagesChange: (images: Record<number, SavedImage>) => void;
  savedPromptOverrides: Record<number, string>;
  onPromptOverridesChange: (overrides: Record<number, string>) => void;
};

export function StoryboardViewer({ content, savedImages, onImagesChange, savedPromptOverrides, onPromptOverridesChange }: StoryboardViewerProps) {
  const { intro, acts } = useMemo(() => parseStoryboardPrompts(content), [content]);
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<Record<number, ImageState>>({});
  const [regenStates, setRegenStates] = useState<Record<number, "idle" | "loading">>({});
  const [generatingAll, setGeneratingAll] = useState(false);
  const [genAllProgress, setGenAllProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  // Merge saved images into local state on mount/change
  const images: Record<number, ImageState> = useMemo(() => {
    const merged: Record<number, ImageState> = {};
    for (const [k, v] of Object.entries(savedImages)) {
      merged[Number(k)] = v;
    }
    for (const [k, v] of Object.entries(localImages)) {
      merged[Number(k)] = v; // local (generating/error) overrides saved
    }
    return merged;
  }, [savedImages, localImages]);

  const promptOverrides = savedPromptOverrides;

  const totalScenes = acts.reduce((sum, act) => sum + act.scenes.length, 0);

  const copyPrompt = async (scene: StoryboardScene) => {
    await navigator.clipboard.writeText(scene.prompt);
    setCopiedScene(scene.number);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  const generateImage = async (scene: StoryboardScene) => {
    setLocalImages((prev) => ({ ...prev, [scene.number]: { status: "generating" } }));
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: scene.prompt, camera: scene.camera }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const { url } = await res.json();
      setLocalImages((prev) => ({ ...prev, [scene.number]: { status: "done", url } }));
      // Persist to report
      onImagesChange({ ...savedImages, [scene.number]: { status: "done", url } });
    } catch (error) {
      setLocalImages((prev) => ({
        ...prev,
        [scene.number]: {
          status: "error",
          error: error instanceof Error ? error.message : "Failed",
        },
      }));
    }
  };

  // All scenes flattened for "generate all"
  const allScenes = useMemo(() => acts.flatMap((a) => a.scenes), [acts]);

  const generateAllImages = async () => {
    const scenesToGenerate = allScenes.filter(
      (s) => !savedImages[s.number]
    );
    if (scenesToGenerate.length === 0) return;

    cancelRef.current = false;
    setGeneratingAll(true);
    setGenAllProgress({ done: 0, total: scenesToGenerate.length });

    let updatedImages = { ...savedImages };

    for (let i = 0; i < scenesToGenerate.length; i++) {
      if (cancelRef.current) break;
      const scene = scenesToGenerate[i];
      const displayScene = promptOverrides[scene.number]
        ? { ...scene, prompt: promptOverrides[scene.number] }
        : scene;

      setLocalImages((prev) => ({ ...prev, [scene.number]: { status: "generating" } }));

      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: displayScene.prompt, camera: displayScene.camera }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { url } = await res.json();
        setLocalImages((prev) => ({ ...prev, [scene.number]: { status: "done", url } }));
        updatedImages = { ...updatedImages, [scene.number]: { status: "done" as const, url } };
        onImagesChange(updatedImages);
      } catch {
        setLocalImages((prev) => ({
          ...prev,
          [scene.number]: { status: "error", error: "Failed" },
        }));
      }

      setGenAllProgress({ done: i + 1, total: scenesToGenerate.length });
    }

    setGeneratingAll(false);
  };

  const cancelGenerateAll = () => {
    cancelRef.current = true;
  };

  const editPrompt = (sceneNumber: number, newPrompt: string) => {
    const updated = { ...savedPromptOverrides, [sceneNumber]: newPrompt };
    onPromptOverridesChange(updated);
  };

  const regenPrompt = async (scene: StoryboardScene) => {
    setRegenStates((prev) => ({ ...prev, [scene.number]: "loading" }));
    try {
      const res = await fetch("/api/regenerate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: scene.prompt, slugLine: scene.slugLine }),
      });
      if (!res.ok) throw new Error("Failed");
      const { prompt } = await res.json();
      const updated = { ...savedPromptOverrides, [scene.number]: prompt };
      onPromptOverridesChange(updated);
    } catch {
      // silently fail — original prompt stays
    }
    setRegenStates((prev) => ({ ...prev, [scene.number]: "idle" }));
  };

  return (
    <div>
      {intro && (
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
          {intro}
        </p>
      )}

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Scene Prompts
        </h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground">{totalScenes} scenes</span>
        {generatingAll ? (
          <button
            onClick={cancelGenerateAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Loader2 size={13} className="animate-spin" />
            {genAllProgress.done}/{genAllProgress.total} — Cancel
          </button>
        ) : (
          <button
            onClick={generateAllImages}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Images size={13} />
            Generate all images
          </button>
        )}
      </div>

      <div className="space-y-8">
        {acts.map((act) => (
          <section key={act.label}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                {act.label}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">{act.scenes.length} scenes</span>
            </div>

            <div className="space-y-4">
              {act.scenes.map((scene) => {
                const displayScene = promptOverrides[scene.number]
                  ? { ...scene, prompt: promptOverrides[scene.number] }
                  : scene;
                return (
                  <SceneCard
                    key={scene.number}
                    scene={displayScene}
                    copiedScene={copiedScene}
                    onCopy={copyPrompt}
                    imageState={images[scene.number] || { status: "idle" }}
                    onGenerate={generateImage}
                    regenState={regenStates[scene.number] || "idle"}
                    onRegenPrompt={regenPrompt}
                    onEditPrompt={editPrompt}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
