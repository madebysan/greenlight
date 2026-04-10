"use client";

import { useState, useMemo } from "react";
import { Video, Sun, Heart, Check, Copy, ImageIcon, Loader2, Download } from "lucide-react";

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
  const actLabels: { label: string; startScene: number }[] = [];
  let current: StoryboardScene | null = null;
  let collectingPrompt = false;
  let promptBuffer = "";
  let introBuffer = "";
  let pastIntro = false;

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
          actLabels.push({ label: actText, startScene: allScenes.length + 1 });
        }
        continue;
      }
      // Act heading after scenes have started
      const actText = actMatch[1].trim();
      actLabels.push({ label: actText, startScene: allScenes.length + 1 });
      continue;
    }

    // Scene heading: ### Scene N: SLUG_LINE
    const sceneMatch = line.match(/^### Scene (\d+):\s*(.+)/);
    if (sceneMatch) {
      pastIntro = true;
      if (current) {
        if (collectingPrompt) current.prompt = promptBuffer.trim();
        allScenes.push(current);
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
    // Use parsed act labels
    acts = actLabels.map((act, i) => {
      const nextStart = actLabels[i + 1]?.startScene ?? allScenes.length + 1;
      return {
        label: act.label,
        scenes: allScenes.filter((s) => s.number >= act.startScene && s.number < nextStart),
      };
    });
    // Catch any scenes before the first act label
    const firstActStart = actLabels[0].startScene;
    const preActScenes = allScenes.filter((s) => s.number < firstActStart);
    if (preActScenes.length > 0) {
      acts.unshift({ label: "Prologue", scenes: preActScenes });
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

function SceneCard({ scene, copiedScene, onCopy, imageState, onGenerate }: {
  scene: StoryboardScene;
  copiedScene: number | null;
  onCopy: (scene: StoryboardScene) => void;
  imageState: ImageState;
  onGenerate: (scene: StoryboardScene) => void;
}) {
  const isCopied = copiedScene === scene.number;
  const intExtMatch = scene.slugLine.match(/^(INT|EXT)\b/i);
  const intExt = intExtMatch ? intExtMatch[1].toUpperCase() : "";

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Scene header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/5 text-xs font-bold shrink-0 tabular-nums">
          {scene.number}
        </span>
        {intExt && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
            intExt === "EXT"
              ? "bg-sky-50 text-sky-700 border-sky-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
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
          onClick={() => onCopy(scene)}
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
            isCopied
              ? "bg-green-50 text-green-700 border-green-200"
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
          <p className="text-[13px] leading-[1.8] text-foreground/80">
            {scene.prompt}
          </p>

          {/* Metadata chips */}
          {(scene.camera || scene.lighting || scene.mood) && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
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

export function StoryboardViewer({ content }: { content: string }) {
  const { intro, acts } = useMemo(() => parseStoryboardPrompts(content), [content]);
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [images, setImages] = useState<Record<number, ImageState>>({});

  const totalScenes = acts.reduce((sum, act) => sum + act.scenes.length, 0);

  const copyPrompt = async (scene: StoryboardScene) => {
    await navigator.clipboard.writeText(scene.prompt);
    setCopiedScene(scene.number);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  const generateImage = async (scene: StoryboardScene) => {
    setImages((prev) => ({ ...prev, [scene.number]: { status: "generating" } }));
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
      setImages((prev) => ({ ...prev, [scene.number]: { status: "done", url } }));
    } catch (error) {
      setImages((prev) => ({
        ...prev,
        [scene.number]: {
          status: "error",
          error: error instanceof Error ? error.message : "Failed",
        },
      }));
    }
  };

  return (
    <div>
      {intro && (
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
          {intro}
        </p>
      )}

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Scene Prompts
        </h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground">{totalScenes} scenes</span>
      </div>

      <div className="space-y-8">
        {acts.map((act) => (
          <section key={act.label}>
            {/* Act header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1">
                {act.label}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">{act.scenes.length} scenes</span>
            </div>

            <div className="space-y-4">
              {act.scenes.map((scene) => (
                <SceneCard
                  key={scene.number}
                  scene={scene}
                  copiedScene={copiedScene}
                  onCopy={copyPrompt}
                  imageState={images[scene.number] || { status: "idle" }}
                  onGenerate={generateImage}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
