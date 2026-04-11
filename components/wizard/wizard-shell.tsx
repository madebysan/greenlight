"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, Info, RotateCcw, FileText, Download, Share2, Sun, Moon, Bookmark, Check, Images, Loader2 } from "lucide-react";
import { parseStoryboardPrompts } from "@/components/viewers/storyboard-viewer";
import { parsePosterConcepts } from "@/components/viewers/poster-concepts-viewer";
import { HeaderButton, MoreMenu } from "./header-menu";
import { AboutDialog } from "./about-dialog";
import { findCachedProject } from "@/lib/cached-projects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StepInstructions } from "./step-instructions";
import { StepJsonInput } from "./step-json-input";
import { StepGenerating } from "./step-generating";
import { StepResults } from "./step-results";
import {
  type SavedImage,
  API_KEY_STORAGE,
  FAL_KEY_STORAGE,
  loadProject,
  saveProject,
  updateProject,
  clearProject,
  extractTitle,
} from "@/lib/reports";
import { downloadBlob } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Extract" },
  { number: 2, label: "Paste JSON" },
  { number: 3, label: "Generate" },
  { number: 4, label: "Results" },
];

export type DocumentResult = {
  name: string;
  slug: string;
  status: "pending" | "generating" | "done" | "error";
  content: string | null;
  error: string | null;
};

const INITIAL_DOCS: DocumentResult[] = [
  { name: "Overview", slug: "overview", status: "pending", content: null, error: null },
  { name: "Mood & Tone", slug: "mood-and-tone", status: "pending", content: null, error: null },
  { name: "Scenes", slug: "scene-breakdown", status: "pending", content: null, error: null },
  { name: "Storyboards", slug: "storyboard-prompts", status: "pending", content: null, error: null },
  { name: "Poster Concepts", slug: "poster-concepts", status: "pending", content: null, error: null },
];

export function WizardShell() {
  const [hydrated, setHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [apiKey, setApiKey] = useState<string>("");
  const [jsonData, setJsonData] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentResult[]>(INITIAL_DOCS);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [falKey, setFalKey] = useState<string>("");
  const [storyboardImages, setStoryboardImages] = useState<Record<number, SavedImage>>({});
  const [promptOverrides, setPromptOverrides] = useState<Record<number, string>>({});
  const [posterImages, setPosterImages] = useState<Record<number, SavedImage>>({});
  const [portraits, setPortraits] = useState<Record<string, SavedImage>>({});
  const [propImages, setPropImages] = useState<Record<string, SavedImage>>({});
  const [disabledItems, setDisabledItems] = useState<Record<string, boolean>>({});
  // Holds cached documents when the submitted JSON's title matches a
  // pre-cached project. Triggers fake-progression mode in StepGenerating.
  const [prefilledDocs, setPrefilledDocs] = useState<DocumentResult[] | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Hydrate from localStorage on mount.
  // setState in an effect is intentional here: we need SSR to render a neutral
  // "Loading..." state and only read localStorage after client hydration to
  // avoid hydration mismatch. React 18+ auto-batches these updates.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const project = loadProject();
    if (project) {
      setJsonData(project.jsonData || "");
      setDocuments(
        project.documents.map((d) => ({
          ...d,
          status: d.status as DocumentResult["status"],
        }))
      );
      setStoryboardImages(project.images || {});
      setPromptOverrides(project.promptOverrides || {});
      setPosterImages(project.posterImages || {});
      setPortraits(project.portraits || {});
      setPropImages(project.propImages || {});
      setDisabledItems(project.disabledItems || {});
      setCurrentStep(4);
    }
    setApiKey(localStorage.getItem(API_KEY_STORAGE) || "");
    setFalKey(localStorage.getItem(FAL_KEY_STORAGE) || "");
    setTheme(localStorage.getItem("greenlight-theme") === "light" ? "light" : "dark");
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
  };

  const handleJsonSubmit = (json: string) => {
    setJsonData(json);

    // Check if this film title matches a pre-cached project. If so, we'll
    // fake the generation step using the cached documents. Fresh image state
    // — we deliberately don't restore images so the demo walkthrough still
    // shows image generation as a live step.
    try {
      const parsed = JSON.parse(json);
      const cached = findCachedProject(parsed.title || "");
      if (cached) {
        setPrefilledDocs(
          cached.documents.map((d) => ({
            name: d.name,
            slug: d.slug,
            status: d.status as DocumentResult["status"],
            content: d.content,
            error: d.error,
          })),
        );
      } else {
        setPrefilledDocs(null);
      }
    } catch {
      setPrefilledDocs(null);
    }

    setCurrentStep(3);
  };

  const handleGenerationComplete = useCallback(
    (results: DocumentResult[]) => {
      setDocuments(results);
      setCurrentStep(4);

      saveProject({
        title: extractTitle(jsonData),
        createdAt: new Date().toISOString(),
        jsonData,
        documents: results.map((d) => ({
          name: d.name,
          slug: d.slug,
          status: d.status === "done" ? "done" : "error",
          content: d.content,
          error: d.error,
        })),
      });
    },
    [jsonData]
  );

  const handleDownloadAll = () => {
    documents
      .filter((d) => d.status === "done" && d.content)
      .forEach((doc) => {
        downloadBlob(doc.content!, `${doc.slug}.md`, "text/markdown");
      });
  };

  const handleDownloadJson = () => {
    if (!jsonData) return;
    downloadBlob(jsonData, "screenplay-data.json", "application/json");
  };

  const handleStartOver = () => {
    clearProject();
    setCurrentStep(1);
    setJsonData("");
    setDocuments(INITIAL_DOCS);
    setStoryboardImages({});
    setPromptOverrides({});
    setPosterImages({});
    setPortraits({});
    setPropImages({});
    setDisabledItems({});
  };

  const handleImagesChange = useCallback((images: Record<number, SavedImage>) => {
    setStoryboardImages(images);
    updateProject({ images });
  }, []);

  const handlePromptOverridesChange = useCallback((promptOverrides: Record<number, string>) => {
    setPromptOverrides(promptOverrides);
    updateProject({ promptOverrides });
  }, []);

  const handlePosterImagesChange = useCallback((posterImages: Record<number, SavedImage>) => {
    setPosterImages(posterImages);
    updateProject({ posterImages });
  }, []);

  const handlePortraitsChange = useCallback((portraits: Record<string, SavedImage>) => {
    setPortraits(portraits);
    updateProject({ portraits });
  }, []);

  const handlePropImagesChange = useCallback((images: Record<string, SavedImage>) => {
    setPropImages(images);
    updateProject({ propImages: images });
  }, []);

  const handleDisabledItemsChange = useCallback((disabled: Record<string, boolean>) => {
    setDisabledItems(disabled);
    updateProject({ disabledItems: disabled });
  }, []);

  const [genAllImages, setGenAllImages] = useState<{
    running: boolean;
    done: number;
    total: number;
  }>({ running: false, done: 0, total: 0 });
  const genAllCancelRef = useRef(false);

  const handleGenerateAllImages = async () => {
    if (genAllImages.running) {
      genAllCancelRef.current = true;
      return;
    }
    if (!jsonData) return;

    type Task = { kind: string; run: () => Promise<void> };
    const tasks: Task[] = [];

    // --- Parse inputs ---
    let parsed: {
      characters?: { name: string; description?: string }[];
      props_master?: { item: string; notes?: string }[];
    } = {};
    try {
      parsed = JSON.parse(jsonData);
    } catch {
      return;
    }

    // --- Accumulate state as we go so each setState call gets the full picture ---
    let accPortraits = { ...portraits };
    let accPropImages = { ...propImages };
    let accStoryboardImages = { ...storyboardImages };
    let accPosterImages = { ...posterImages };

    // Character portraits
    for (const char of parsed.characters || []) {
      if (accPortraits[char.name]) continue;
      tasks.push({
        kind: "portrait",
        run: async () => {
          const res = await fetch("/api/generate-portrait", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: char.name, description: char.description }),
          });
          if (!res.ok) return;
          const { url } = await res.json();
          accPortraits = { ...accPortraits, [char.name]: { status: "done" as const, url } };
          handlePortraitsChange(accPortraits);
        },
      });
    }

    // Prop reference images
    for (const prop of parsed.props_master || []) {
      if (accPropImages[prop.item]) continue;
      tasks.push({
        kind: "prop",
        run: async () => {
          const res = await fetch("/api/generate-prop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: prop.item, notes: prop.notes }),
          });
          if (!res.ok) return;
          const { url } = await res.json();
          accPropImages = { ...accPropImages, [prop.item]: { status: "done" as const, url } };
          handlePropImagesChange(accPropImages);
        },
      });
    }

    // Storyboard frames
    const sbDoc = documents.find((d) => d.slug === "storyboard-prompts");
    if (sbDoc?.content) {
      const { acts } = parseStoryboardPrompts(sbDoc.content);
      for (const act of acts) {
        for (const scene of act.scenes) {
          if (accStoryboardImages[scene.number]) continue;
          const prompt = promptOverrides[scene.number] || scene.prompt;
          const camera = scene.camera;
          tasks.push({
            kind: "storyboard",
            run: async () => {
              const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, camera }),
              });
              if (!res.ok) return;
              const { url } = await res.json();
              accStoryboardImages = {
                ...accStoryboardImages,
                [scene.number]: { status: "done" as const, url },
              };
              handleImagesChange(accStoryboardImages);
            },
          });
        }
      }
    }

    // Poster concepts
    const posterDoc = documents.find((d) => d.slug === "poster-concepts");
    if (posterDoc?.content) {
      const { concepts } = parsePosterConcepts(posterDoc.content);
      for (const concept of concepts) {
        if (accPosterImages[concept.number]) continue;
        const prompt = [
          concept.composition,
          concept.style ? `Style: ${concept.style}.` : "",
        ]
          .filter(Boolean)
          .join(" ");
        tasks.push({
          kind: "poster",
          run: async () => {
            const res = await fetch("/api/generate-poster-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt }),
            });
            if (!res.ok) return;
            const { url } = await res.json();
            accPosterImages = {
              ...accPosterImages,
              [concept.number]: { status: "done" as const, url },
            };
            handlePosterImagesChange(accPosterImages);
          },
        });
      }
    }

    if (tasks.length === 0) return;

    genAllCancelRef.current = false;
    setGenAllImages({ running: true, done: 0, total: tasks.length });

    for (let i = 0; i < tasks.length; i++) {
      if (genAllCancelRef.current) break;
      try {
        await tasks[i].run();
      } catch (e) {
        console.error(`[generate-all] ${tasks[i].kind} failed`, e);
      }
      setGenAllImages({ running: true, done: i + 1, total: tasks.length });
    }

    setGenAllImages({ running: false, done: 0, total: 0 });
  };

  const [savingDemo, setSavingDemo] = useState<"idle" | "saving" | "saved">("idle");
  const handleSaveDemo = async () => {
    const current = loadProject();
    if (!current) return;
    setSavingDemo("saving");
    try {
      const res = await fetch("/api/save-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavingDemo("saved");
      setTimeout(() => setSavingDemo("idle"), 2500);
    } catch (e) {
      console.error("Save as demo failed", e);
      setSavingDemo("idle");
    }
  };

  const [savingCached, setSavingCached] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const handleSaveCached = async () => {
    const current = loadProject();
    if (!current) return;
    setSavingCached("saving");
    try {
      const res = await fetch("/api/save-cached", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavingCached("saved");
      setTimeout(() => setSavingCached("idle"), 2500);
    } catch (e) {
      console.error("Save to cache failed", e);
      setSavingCached("idle");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("greenlight-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleDocumentUpdate = (slug: string, newContent: string) => {
    const updated = documents.map((d) =>
      d.slug === slug ? { ...d, content: newContent } : d
    );
    setDocuments(updated);
    updateProject({
      documents: updated.map((d) => ({
        name: d.name,
        slug: d.slug,
        status: d.status === "done" ? ("done" as const) : ("error" as const),
        content: d.content,
        error: d.error,
      })),
    });
  };

  const handleDocumentRewrite = async (slug: string) => {
    if (!jsonData || !apiKey) return;
    const res = await fetch(`/api/generate/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonData, apiKey }),
    });
    if (!res.ok) throw new Error("Rewrite failed");
    const data = await res.json();
    handleDocumentUpdate(slug, data.content);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const hasActiveProject = currentStep === 4;

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className={`mx-auto px-6 py-4 ${currentStep === 4 ? "max-w-6xl" : "max-w-4xl"}`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Greenlight" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Greenlight</h1>
              <p className="text-[13px] text-muted-foreground">
                A 1st AD&apos;s first pass.
              </p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {genAllImages.running && (
                <button
                  onClick={handleGenerateAllImages}
                  title="Click to cancel"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/30 hover:bg-primary/15 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Loader2 size={13} className="animate-spin" />
                  <span className="tabular-nums">
                    {genAllImages.done}/{genAllImages.total}
                  </span>
                  <span className="text-primary/70">images</span>
                </button>
              )}
              {hasActiveProject && (
                <HeaderButton
                  icon={<RotateCcw size={14} />}
                  label="Start Over"
                  onClick={handleStartOver}
                  title="Start a new project"
                />
              )}
              <MoreMenu
                items={[
                  hasActiveProject && documents.some((d) => d.status === "done")
                    ? {
                        icon: genAllImages.running ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Images size={14} />
                        ),
                        label: genAllImages.running
                          ? `Generating ${genAllImages.done}/${genAllImages.total}… (click to cancel)`
                          : "Generate all images",
                        onClick: handleGenerateAllImages,
                      }
                    : null,
                  hasActiveProject && documents.some((d) => d.status === "done")
                    ? "divider"
                    : null,
                  hasActiveProject && documents.some((d) => d.status === "done")
                    ? {
                        icon: <Share2 size={14} />,
                        label: "Share",
                        onClick: () => window.open("/share", "_blank"),
                      }
                    : null,
                  hasActiveProject && documents.some((d) => d.status === "done")
                    ? {
                        icon: <Download size={14} />,
                        label: "Download all documents",
                        onClick: handleDownloadAll,
                      }
                    : null,
                  hasActiveProject && jsonData
                    ? {
                        icon: <FileText size={14} />,
                        label: "Download JSON",
                        onClick: handleDownloadJson,
                      }
                    : null,
                  "divider",
                  {
                    icon: theme === "dark" ? <Sun size={14} /> : <Moon size={14} />,
                    label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
                    onClick: toggleTheme,
                  },
                  {
                    icon: <Settings size={14} />,
                    label: "Settings",
                    onClick: () => setShowSettings(true),
                  },
                  {
                    icon: <Info size={14} />,
                    label: "About",
                    onClick: () => setShowAbout(true),
                  },
                  process.env.NODE_ENV === "development" &&
                  hasActiveProject &&
                  documents.some((d) => d.status === "done")
                    ? "divider"
                    : null,
                  process.env.NODE_ENV === "development" &&
                  hasActiveProject &&
                  documents.some((d) => d.status === "done")
                    ? {
                        icon:
                          savingDemo === "saved" ? (
                            <Check size={14} />
                          ) : (
                            <Bookmark size={14} />
                          ),
                        label:
                          savingDemo === "saving"
                            ? "Saving snapshot..."
                            : savingDemo === "saved"
                            ? "Saved to /demo"
                            : "Save as demo (dev)",
                        onClick: handleSaveDemo,
                      }
                    : null,
                  process.env.NODE_ENV === "development" &&
                  hasActiveProject &&
                  documents.some((d) => d.status === "done")
                    ? {
                        icon:
                          savingCached === "saved" ? (
                            <Check size={14} />
                          ) : (
                            <Bookmark size={14} />
                          ),
                        label:
                          savingCached === "saving"
                            ? "Saving to cache..."
                            : savingCached === "saved"
                            ? "Cached by title"
                            : "Save to cache (dev)",
                        onClick: handleSaveCached,
                      }
                    : null,
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      {currentStep < 4 && (
        <div className={`mx-auto px-6 py-6 ${currentStep === 4 ? "max-w-6xl" : "max-w-4xl"}`}>
          <div className="flex items-center">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      currentStep === step.number
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : currentStep > step.number
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? "\u2713" : step.number}
                  </div>
                  <span
                    className={`text-sm ${
                      currentStep === step.number
                        ? "font-semibold text-foreground"
                        : currentStep > step.number
                          ? "font-medium text-primary/70"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-12 mx-3 rounded-full transition-colors ${
                      currentStep > step.number ? "bg-primary/30" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <main
        className={`mx-auto px-6 pb-12 ${
          currentStep === 4 ? "max-w-6xl" : "max-w-4xl"
        }`}
      >
        {currentStep === 1 && (
          <StepInstructions onNext={() => setCurrentStep(2)} />
        )}
        {currentStep === 2 && (
          <StepJsonInput
            onSubmit={handleJsonSubmit}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <StepGenerating
            apiKey={apiKey}
            jsonData={jsonData}
            documents={documents}
            setDocuments={setDocuments}
            onComplete={handleGenerationComplete}
            prefilledDocs={prefilledDocs || undefined}
          />
        )}
        {currentStep === 4 && (
          <StepResults
            documents={documents}
            jsonData={jsonData}
            onStartOver={handleStartOver}
            onDocumentUpdate={handleDocumentUpdate}
            onDocumentRewrite={handleDocumentRewrite}
            storyboardImages={storyboardImages}
            onStoryboardImagesChange={handleImagesChange}
            promptOverrides={promptOverrides}
            onPromptOverridesChange={handlePromptOverridesChange}
            posterImages={posterImages}
            onPosterImagesChange={handlePosterImagesChange}
            portraits={portraits}
            onPortraitsChange={handlePortraitsChange}
            propImages={propImages}
            onPropImagesChange={handlePropImagesChange}
            disabledItems={disabledItems}
            onDisabledItemsChange={handleDisabledItemsChange}
          />
        )}
      </main>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Claude API Key</label>
              <p className="text-[12px] text-muted-foreground">
                Used to generate documents from your screenplay data.{" "}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  Get a key
                </a>
              </p>
              <input
                type="password"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">fal.ai API Key</label>
              <p className="text-[12px] text-muted-foreground">
                Used to generate storyboard sketches, poster concepts, and character portraits.{" "}
                <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  Get a key
                </a>
              </p>
              <input
                type="password"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:..."
                value={falKey}
                onChange={(e) => {
                  setFalKey(e.target.value);
                  localStorage.setItem(FAL_KEY_STORAGE, e.target.value);
                }}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Keys are stored in your browser only. They are never sent to our servers.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
    </div>
  );
}
