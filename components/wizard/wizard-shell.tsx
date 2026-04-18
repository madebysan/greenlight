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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StepInstructions } from "./step-instructions";
import { StepJsonInput } from "./step-json-input";
import { StepGenerating } from "./step-generating";
import { StepResults } from "./step-results";
import {
  type SavedImage,
  type SavedProject,
  loadProject,
  saveProject,
  updateProject,
  clearProject,
  extractTitle,
} from "@/lib/reports";
import { useApiKeys } from "@/lib/api-keys-context";
import {
  type ImagePromptKind,
  DEFAULT_IMAGE_PROMPTS,
  loadImagePrompts,
  saveImagePrompts,
  getStylePrefix,
} from "@/lib/image-prompts";
import { downloadBlob } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Start" },
  { number: 2, label: "Generate" },
  { number: 3, label: "Review" },
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
  const { apiKey, falKey, tmdbKey, setApiKey, setFalKey, setTmdbKey, ensureKeys } = useApiKeys();
  const [hydrated, setHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [jsonData, setJsonData] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentResult[]>(INITIAL_DOCS);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [imagePrompts, setImagePrompts] = useState<Record<ImagePromptKind, string>>({
    storyboard: DEFAULT_IMAGE_PROMPTS.storyboard,
    portrait: DEFAULT_IMAGE_PROMPTS.portrait,
    prop: DEFAULT_IMAGE_PROMPTS.prop,
    poster: DEFAULT_IMAGE_PROMPTS.poster,
  });
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
      setCurrentStep(3);
    }
    setTheme(localStorage.getItem("greenlight-theme") === "light" ? "light" : "dark");
    // Merge stored overrides into defaults so blank fields fall back cleanly.
    const stored = loadImagePrompts();
    setImagePrompts({
      storyboard: stored.storyboard ?? DEFAULT_IMAGE_PROMPTS.storyboard,
      portrait: stored.portrait ?? DEFAULT_IMAGE_PROMPTS.portrait,
      prop: stored.prop ?? DEFAULT_IMAGE_PROMPTS.prop,
      poster: stored.poster ?? DEFAULT_IMAGE_PROMPTS.poster,
    });
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleImagePromptChange = (kind: ImagePromptKind, value: string) => {
    const next = { ...imagePrompts, [kind]: value };
    setImagePrompts(next);
    // Persist only entries that differ from defaults so a blank reset restores defaults.
    const overrides: Partial<Record<ImagePromptKind, string>> = {};
    for (const k of Object.keys(next) as ImagePromptKind[]) {
      if (next[k].trim() && next[k].trim() !== DEFAULT_IMAGE_PROMPTS[k]) {
        overrides[k] = next[k];
      }
    }
    saveImagePrompts(overrides);
  };

  const handleResetImagePrompt = (kind: ImagePromptKind) => {
    handleImagePromptChange(kind, DEFAULT_IMAGE_PROMPTS[kind]);
  };

  const handleJsonSubmit = async (json: string) => {
    // Figure out whether this is a cached demo project (title match). Cached
    // projects take the fake-gen path and don't need any API keys — so we
    // skip the ensureKeys prompt for them.
    let isCached = false;
    let prefilled: DocumentResult[] | null = null;
    try {
      const parsed = JSON.parse(json);
      const cached = findCachedProject(parsed.title || "");
      if (cached) {
        isCached = true;
        prefilled = cached.documents.map((d) => ({
          name: d.name,
          slug: d.slug,
          status: d.status as DocumentResult["status"],
          content: d.content,
          error: d.error,
        }));
      }
    } catch {
      /* parse failed — treat as non-cached */
    }

    // Non-cached path needs a Claude key. fal is optional but if supplied
    // the auto-enqueue effect will kick off images in parallel.
    if (!isCached) {
      const keys = await ensureKeys();
      if (!keys) return; // user cancelled — stay on step 1
    }

    setJsonData(json);
    setPrefilledDocs(prefilled);
    setCurrentStep(2);
  };

  const handleGenerationComplete = useCallback(
    (results: DocumentResult[]) => {
      setDocuments(results);
      setCurrentStep(3);

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
    if (jsonData) {
      downloadBlob(jsonData, "screenplay-data.json", "application/json");
    }
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

  const handleJsonDataChange = useCallback((newJsonData: string) => {
    setJsonData(newJsonData);
    updateProject({ jsonData: newJsonData });
  }, []);

  // --- Image generation: task queue ---
  //
  // Tasks are enqueued incrementally. Portraits + props fire the moment JSON
  // is ready; storyboard + poster images fire the moment their parent Claude
  // doc lands. Everything runs in the background in parallel with text
  // generation. A single worker drains the queue with 500ms stagger between
  // task starts — each task runs independently and updates its accumulator
  // ref atomically (JS's single-threaded event loop makes the read-modify-
  // write safe for concurrent task resolutions).
  type ImageTaskKind = "portrait" | "prop" | "storyboard" | "poster";
  type ImageTask = {
    key: string;
    kind: ImageTaskKind;
    run: (falKey: string) => Promise<void>;
  };

  const [imageGen, setImageGen] = useState<{
    running: boolean;
    done: number;
    total: number;
    failed: number;
  }>({ running: false, done: 0, total: 0, failed: 0 });

  const imageQueueRef = useRef<ImageTask[]>([]);
  const imageEnqueuedKeysRef = useRef<Set<string>>(new Set());
  const imageWorkerActiveRef = useRef(false);
  const imageInFlightRef = useRef(0);
  const imageCancelRef = useRef(false);

  // Accumulator refs stay in sync with state so concurrent tasks can merge
  // results without clobbering each other. Declared BEFORE the auto-enqueue
  // effect so hydration syncs land before we start reading refs.
  const portraitsRef = useRef<Record<string, SavedImage>>(portraits);
  const propImagesRef = useRef<Record<string, SavedImage>>(propImages);
  const storyboardImagesRef = useRef<Record<number, SavedImage>>(storyboardImages);
  const posterImagesRef = useRef<Record<number, SavedImage>>(posterImages);
  const falKeyRef = useRef<string>(falKey);
  const promptOverridesRef = useRef<Record<number, string>>(promptOverrides);

  useEffect(() => { portraitsRef.current = portraits; }, [portraits]);
  useEffect(() => { propImagesRef.current = propImages; }, [propImages]);
  useEffect(() => { storyboardImagesRef.current = storyboardImages; }, [storyboardImages]);
  useEffect(() => { posterImagesRef.current = posterImages; }, [posterImages]);
  useEffect(() => { falKeyRef.current = falKey; }, [falKey]);
  useEffect(() => { promptOverridesRef.current = promptOverrides; }, [promptOverrides]);

  const fakeGenerateAllImages = async (cached: SavedProject) => {
    type FakeTask = { apply: () => void };
    const tasks: FakeTask[] = [];

    // Collect all cached images as tasks that set state
    if (cached.images) {
      let accSb = { ...storyboardImages };
      for (const [num, img] of Object.entries(cached.images)) {
        if (accSb[Number(num)]) continue;
        const n = Number(num);
        const savedImg = img as SavedImage;
        tasks.push({
          apply: () => {
            accSb = { ...accSb, [n]: savedImg };
            handleImagesChange(accSb);
          },
        });
      }
    }
    if (cached.portraits) {
      let accP = { ...portraits };
      for (const [name, img] of Object.entries(cached.portraits)) {
        if (accP[name]) continue;
        const savedImg = img as SavedImage;
        tasks.push({
          apply: () => {
            accP = { ...accP, [name]: savedImg };
            handlePortraitsChange(accP);
          },
        });
      }
    }
    if (cached.propImages) {
      let accPr = { ...propImages };
      for (const [name, img] of Object.entries(cached.propImages)) {
        if (accPr[name]) continue;
        const savedImg = img as SavedImage;
        tasks.push({
          apply: () => {
            accPr = { ...accPr, [name]: savedImg };
            handlePropImagesChange(accPr);
          },
        });
      }
    }
    if (cached.posterImages) {
      let accPo = { ...posterImages };
      for (const [num, img] of Object.entries(cached.posterImages)) {
        if (accPo[Number(num)]) continue;
        const n = Number(num);
        const savedImg = img as SavedImage;
        tasks.push({
          apply: () => {
            accPo = { ...accPo, [n]: savedImg };
            handlePosterImagesChange(accPo);
          },
        });
      }
    }

    if (tasks.length === 0) return;

    imageCancelRef.current = false;
    setImageGen({ running: true, done: 0, total: tasks.length, failed: 0 });

    // Stagger: reveal one image every 300-600ms (randomized)
    for (let i = 0; i < tasks.length; i++) {
      if (imageCancelRef.current) break;
      tasks[i].apply();
      setImageGen((p) => ({ ...p, done: i + 1 }));
      const delay = 300 + Math.random() * 300;
      await new Promise((r) => setTimeout(r, delay));
    }

    setImageGen({ running: false, done: 0, total: 0, failed: 0 });
  };

  const buildPortraitTasks = (
    json: string,
    existing: Record<string, SavedImage>,
  ): ImageTask[] => {
    let parsed: { characters?: { name: string; description?: string }[] } = {};
    try { parsed = JSON.parse(json); } catch { return []; }
    const tasks: ImageTask[] = [];
    for (const char of parsed.characters || []) {
      if (existing[char.name]) continue;
      tasks.push({
        key: `portrait:${char.name}`,
        kind: "portrait",
        run: async (fk) => {
          const res = await fetch("/api/generate-portrait", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: char.name,
              description: char.description,
              stylePrefix: getStylePrefix("portrait"),
              apiKey: fk,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const { url } = await res.json();
          const next = { ...portraitsRef.current, [char.name]: { status: "done" as const, url } };
          portraitsRef.current = next;
          handlePortraitsChange(next);
        },
      });
    }
    return tasks;
  };

  const buildPropTasks = (
    json: string,
    existing: Record<string, SavedImage>,
  ): ImageTask[] => {
    let parsed: { props_master?: { item: string; notes?: string }[] } = {};
    try { parsed = JSON.parse(json); } catch { return []; }
    const tasks: ImageTask[] = [];
    for (const prop of parsed.props_master || []) {
      if (existing[prop.item]) continue;
      tasks.push({
        key: `prop:${prop.item}`,
        kind: "prop",
        run: async (fk) => {
          const res = await fetch("/api/generate-prop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: prop.item,
              notes: prop.notes,
              stylePrefix: getStylePrefix("prop"),
              apiKey: fk,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const { url } = await res.json();
          const next = { ...propImagesRef.current, [prop.item]: { status: "done" as const, url } };
          propImagesRef.current = next;
          handlePropImagesChange(next);
        },
      });
    }
    return tasks;
  };

  const buildStoryboardTasks = (
    sbContent: string,
    existing: Record<number, SavedImage>,
    overrides: Record<number, string>,
  ): ImageTask[] => {
    const tasks: ImageTask[] = [];
    const { acts } = parseStoryboardPrompts(sbContent);
    for (const act of acts) {
      for (const scene of act.scenes) {
        if (existing[scene.number]) continue;
        const prompt = overrides[scene.number] || scene.prompt;
        const camera = scene.camera;
        const num = scene.number;
        tasks.push({
          key: `storyboard:${num}`,
          kind: "storyboard",
          run: async (fk) => {
            const res = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt,
                camera,
                stylePrefix: getStylePrefix("storyboard"),
                apiKey: fk,
              }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { url } = await res.json();
            const next = { ...storyboardImagesRef.current, [num]: { status: "done" as const, url } };
            storyboardImagesRef.current = next;
            handleImagesChange(next);
          },
        });
      }
    }
    return tasks;
  };

  const buildPosterTasks = (
    posterContent: string,
    existing: Record<number, SavedImage>,
  ): ImageTask[] => {
    const tasks: ImageTask[] = [];
    const { concepts } = parsePosterConcepts(posterContent);
    for (const concept of concepts) {
      if (existing[concept.number]) continue;
      const prompt = [
        concept.composition,
        concept.style ? `Style: ${concept.style}.` : "",
      ].filter(Boolean).join(" ");
      const num = concept.number;
      tasks.push({
        key: `poster:${num}`,
        kind: "poster",
        run: async (fk) => {
          const res = await fetch("/api/generate-poster-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              stylePrefix: getStylePrefix("poster"),
              apiKey: fk,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const { url } = await res.json();
          const next = { ...posterImagesRef.current, [num]: { status: "done" as const, url } };
          posterImagesRef.current = next;
          handlePosterImagesChange(next);
        },
      });
    }
    return tasks;
  };

  // Core enqueue + worker. Dedupes via a Set so overlapping enqueues don't
  // fire the same task twice, but releases the key on task settle so failed
  // tasks can be retried on a subsequent manual run.
  const enqueueImageTasks = useCallback((tasks: ImageTask[]) => {
    if (!falKeyRef.current) return;
    const novel = tasks.filter((t) => !imageEnqueuedKeysRef.current.has(t.key));
    if (novel.length === 0) return;
    for (const t of novel) imageEnqueuedKeysRef.current.add(t.key);
    imageQueueRef.current.push(...novel);
    const workerWasIdle = !imageWorkerActiveRef.current;
    // When the worker was idle, we're starting a fresh wave — reset counters
    // so the progress badge reads cleanly for this run.
    setImageGen((p) =>
      workerWasIdle
        ? { running: true, done: 0, total: novel.length, failed: 0 }
        : { ...p, total: p.total + novel.length, running: true },
    );
    if (workerWasIdle) runImageWorker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runImageWorker = () => {
    if (imageWorkerActiveRef.current) return;
    imageWorkerActiveRef.current = true;
    imageCancelRef.current = false;
    (async () => {
      let paymentAborted = false;
      // Outer loop: after the drain + settle cycle, re-check the queue. If
      // enqueueImageTasks was called while we were waiting for in-flight
      // tasks to finish, those tasks would otherwise be orphaned here —
      // adding this re-check means the worker picks up mid-settle enqueues
      // instead of going idle with unprocessed tasks sitting in the queue.
      while (!imageCancelRef.current) {
        // Drain loop — fire tasks with 500ms stagger between starts.
        while (imageQueueRef.current.length > 0) {
          if (imageCancelRef.current) break;
          const fk = falKeyRef.current;
          if (!fk) {
            imageQueueRef.current.length = 0;
            imageEnqueuedKeysRef.current.clear();
            break;
          }
          const task = imageQueueRef.current.shift()!;
          imageInFlightRef.current++;
          // Fire-and-forget — stagger starts by 500ms but let each task
          // resolve independently so a slow one doesn't block the rest.
          task.run(fk)
            .catch((e) => {
              const msg = e instanceof Error ? e.message : String(e);
              if (/402|payment|quota|insufficient/.test(msg)) {
                paymentAborted = true;
                imageCancelRef.current = true;
                imageQueueRef.current.length = 0;
                console.error("[images] credits exhausted", msg);
              } else {
                console.error(`[images] ${task.kind} ${task.key} failed:`, msg);
              }
              setImageGen((p) => ({ ...p, failed: p.failed + 1 }));
            })
            .finally(() => {
              imageInFlightRef.current--;
              imageEnqueuedKeysRef.current.delete(task.key);
              setImageGen((p) => {
                const newDone = p.done + 1;
                const idle =
                  imageQueueRef.current.length === 0 &&
                  imageInFlightRef.current === 0;
                // On the final settle, snap counters clean so the next wave
                // starts from 0/0 instead of inheriting stale progress.
                if (idle) {
                  return { running: false, done: 0, total: 0, failed: p.failed };
                }
                // Never let done exceed total — clamp as a safety net so
                // the badge can't display impossible states like "49/33".
                return {
                  ...p,
                  done: newDone,
                  total: Math.max(p.total, newDone),
                  running: true,
                };
              });
            });
          await new Promise((r) => setTimeout(r, 500));
        }
        // Wait for the last in-flight tasks to settle.
        while (imageInFlightRef.current > 0) {
          await new Promise((r) => setTimeout(r, 100));
        }
        // Re-check: if enqueue pushed new tasks while we were settling, loop
        // back into the drain phase instead of going idle.
        if (imageQueueRef.current.length === 0) break;
      }
      imageWorkerActiveRef.current = false;
      if (paymentAborted) {
        alert("Image generation stopped — your fal.ai API key is out of credits.");
      }
    })();
  };

  const cancelImageGen = () => {
    imageCancelRef.current = true;
    imageQueueRef.current.length = 0;
    imageEnqueuedKeysRef.current.clear();
  };

  // Auto-fire portrait + prop tasks as soon as we have jsonData and a fal key.
  // This runs in parallel with Claude text generation — storyboard and poster
  // images kick off later from the handleDocReady callback when their parent
  // docs land. Skipped for cached projects (they take the fake-gen path).
  const autoStartedForRef = useRef<string>("");
  useEffect(() => {
    if (!jsonData || !falKey) return;
    if (autoStartedForRef.current === jsonData) return;
    try {
      const title = JSON.parse(jsonData).title || "";
      if (findCachedProject(title)) return;
    } catch { /* proceed anyway */ }
    autoStartedForRef.current = jsonData;
    enqueueImageTasks([
      ...buildPortraitTasks(jsonData, portraitsRef.current),
      ...buildPropTasks(jsonData, propImagesRef.current),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonData, falKey]);

  // Called by StepGenerating the moment each Claude doc lands. Lets us fire
  // storyboard / poster image tasks as soon as their source markdown exists
  // instead of waiting for the whole Claude batch to finish.
  const handleDocReady = useCallback(
    (slug: string, content: string) => {
      if (!falKeyRef.current || !content) return;
      if (slug === "storyboard-prompts") {
        enqueueImageTasks(
          buildStoryboardTasks(content, storyboardImagesRef.current, promptOverridesRef.current),
        );
      } else if (slug === "poster-concepts") {
        enqueueImageTasks(buildPosterTasks(content, posterImagesRef.current));
      }
    },
    // buildStoryboardTasks / buildPosterTasks are inline closures that read
    // from refs — they don't need to be in the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enqueueImageTasks],
  );

  const handleGenerateAllImages = async () => {
    if (imageGen.running) {
      cancelImageGen();
      return;
    }
    if (!jsonData) return;

    // --- Fake-gen path for cached projects with pre-committed images ---
    try {
      const parsedTitle = JSON.parse(jsonData).title || "";
      const cached = findCachedProject(parsedTitle);
      if (cached && (cached.images || cached.posterImages || cached.portraits || cached.propImages)) {
        return fakeGenerateAllImages(cached);
      }
    } catch { /* not cached */ }

    // Manual button click — require a fal key (prompt if missing).
    const keys = await ensureKeys({ requireFal: true });
    if (!keys) return;

    const tasks: ImageTask[] = [
      ...buildPortraitTasks(jsonData, portraitsRef.current),
      ...buildPropTasks(jsonData, propImagesRef.current),
    ];
    const sbDoc = documents.find((d) => d.slug === "storyboard-prompts");
    if (sbDoc?.content) {
      tasks.push(
        ...buildStoryboardTasks(sbDoc.content, storyboardImagesRef.current, promptOverridesRef.current),
      );
    }
    const posterDoc = documents.find((d) => d.slug === "poster-concepts");
    if (posterDoc?.content) {
      tasks.push(...buildPosterTasks(posterDoc.content, posterImagesRef.current));
    }

    enqueueImageTasks(tasks);
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

  const hasActiveProject = currentStep === 3;

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className={`mx-auto px-6 py-4 ${currentStep === 3 ? "max-w-6xl" : "max-w-4xl"}`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-[8px] bg-white flex items-center justify-center shadow-pill text-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Greenlight" className="w-[70%] h-[70%]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Greenlight</h1>
              <p className="text-[13px] text-muted-foreground">
                Script to vision deck in minutes.
              </p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {imageGen.running && (
                <button
                  onClick={handleGenerateAllImages}
                  title="Click to cancel"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/30 hover:bg-primary/15 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Loader2 size={13} className="animate-spin" />
                  <span className="tabular-nums">
                    {imageGen.done}/{imageGen.total}
                  </span>
                  <span className="text-primary/70">images</span>
                </button>
              )}
              {hasActiveProject && documents.some((d) => d.status === "done") && (
                <HeaderButton
                  icon={<Share2 size={14} />}
                  label="Share"
                  onClick={() => window.open("/share", "_blank")}
                  title="Open shareable view"
                />
              )}
              <HeaderButton
                icon={theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                onClick={toggleTheme}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              />
              {hasActiveProject && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <HeaderButton
                      icon={<RotateCcw size={14} />}
                      label="Start Over"
                      onClick={() => {}}
                      title="Start a new project"
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Start over?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will discard all generated documents, images, and edits. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleStartOver}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Start Over
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <MoreMenu
                items={[
                  hasActiveProject && documents.some((d) => d.status === "done")
                    ? {
                        icon: imageGen.running ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Images size={14} />
                        ),
                        label: imageGen.running
                          ? `Generating ${imageGen.done}/${imageGen.total}… (click to cancel)`
                          : "Generate all images",
                        onClick: handleGenerateAllImages,
                      }
                    : null,
                  // Show a separate "Retry N failed" action when the last batch
                  // had failures. It's literally the same handler — but the
                  // label primes the user that we know something went wrong.
                  !imageGen.running && imageGen.failed > 0 && hasActiveProject
                    ? {
                        icon: <RotateCcw size={14} />,
                        label: `Retry ${imageGen.failed} failed ${
                          imageGen.failed === 1 ? "image" : "images"
                        }`,
                        onClick: handleGenerateAllImages,
                      }
                    : null,
                  hasActiveProject && documents.some((d) => d.status === "done")
                    ? "divider"
                    : null,
                  hasActiveProject && documents.some((d) => d.status === "done")
                    ? {
                        icon: <FileText size={14} />,
                        label: "Download as PDF",
                        onClick: () => {
                          // Open the print-ready /share view in a new tab and
                          // auto-trigger the browser print dialog so the user
                          // can save as PDF (Cmd/Ctrl+P also works there).
                          const win = window.open("/share", "_blank");
                          if (!win) return;
                          win.addEventListener("load", () => {
                            // Small delay so fonts + TMDB posters settle.
                            setTimeout(() => win.print(), 800);
                          });
                        },
                      }
                    : null,
                  hasActiveProject && documents.some((d) => d.status === "done")
                    ? {
                        icon: <Download size={14} />,
                        label: "Download all documents",
                        onClick: handleDownloadAll,
                      }
                    : null,
                  "divider",
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

      {currentStep < 3 && (
        <div className={`mx-auto px-6 py-8 ${currentStep === 3 ? "max-w-6xl" : "max-w-4xl"}`}>
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const active = currentStep === step.number;
              const done = currentStep > step.number;
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums transition-colors ${
                        active
                          ? "bg-foreground text-background border border-foreground"
                          : done
                            ? "bg-transparent text-foreground border border-foreground/40"
                            : "bg-transparent text-muted-foreground border border-border"
                      }`}
                    >
                      {done ? "\u2713" : step.number.toString().padStart(2, "0")}
                    </div>
                    <span
                      className={`text-[13px] ${
                        active
                          ? "font-semibold text-foreground"
                          : done
                            ? "font-medium text-foreground/70"
                            : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px w-12 mx-4 transition-colors ${
                        done ? "bg-foreground/40" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <main
        className={`mx-auto px-6 pb-12 ${
          currentStep === 3 ? "max-w-6xl" : "max-w-4xl"
        }`}
      >
        {currentStep === 1 && (
          <StepInstructions
            onNext={() => setCurrentStep(2)}
            onSubmitJson={(json) => {
              handleJsonSubmit(json);
            }}
          />
        )}
        {currentStep === 2 && (
          <StepGenerating
            apiKey={apiKey}
            jsonData={jsonData}
            documents={documents}
            setDocuments={setDocuments}
            onComplete={handleGenerationComplete}
            onDocReady={handleDocReady}
            prefilledDocs={prefilledDocs || undefined}
            onStop={() => handleGenerationComplete(documents)}
          />
        )}
        {currentStep === 3 && (
          <StepResults
            documents={documents}
            jsonData={jsonData}
            onJsonDataChange={handleJsonDataChange}
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
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="tracking-tight">Settings</DialogTitle>
          </DialogHeader>

          {/* API keys section */}
          <section className="space-y-5 pt-2">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground pb-3 border-b border-border/60">
              API Keys
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium tracking-tight">Claude API Key</label>
              <p className="text-[12px] text-foreground/60 tracking-tight">
                Used to generate documents from your screenplay data.{" "}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  Get a key
                </a>
              </p>
              <input
                type="password"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-[8px] bg-card/60 shadow-pill px-3 py-2.5 text-[13px] font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:shadow-paper-hover"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium tracking-tight">
                fal.ai API Key{" "}
                <span className="text-muted-foreground font-normal">· optional</span>
              </label>
              <p className="text-[12px] text-foreground/60 tracking-tight">
                Enables storyboard, portrait, prop, and poster image generation. Leave blank for a text-only deck.{" "}
                <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  Get a key
                </a>
              </p>
              <input
                type="password"
                placeholder="fal-..."
                value={falKey}
                onChange={(e) => setFalKey(e.target.value)}
                className="w-full rounded-[8px] bg-card/60 shadow-pill px-3 py-2.5 text-[13px] font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:shadow-paper-hover"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium tracking-tight">
                TMDB API Key{" "}
                <span className="text-muted-foreground font-normal">· optional</span>
              </label>
              <p className="text-[12px] text-foreground/60 tracking-tight">
                Resolves poster thumbnails for Similar Moods and Soundtrack References on the Mood &amp; Tone tab. Free to get.{" "}
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  Get a key
                </a>
              </p>
              <input
                type="password"
                placeholder="TMDB API key (v3 auth)"
                value={tmdbKey}
                onChange={(e) => setTmdbKey(e.target.value)}
                className="w-full rounded-[8px] bg-card/60 shadow-pill px-3 py-2.5 text-[13px] font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:shadow-paper-hover"
              />
            </div>
            <p className="text-[11px] text-foreground/50 tracking-tight">
              Keys are stored in your browser only. They are never sent to our servers.
            </p>
          </section>

          {/* Image style prompts */}
          <section className="space-y-4 pt-6">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground pb-3 border-b border-border/60">
              Image Styles
            </div>
            <p className="text-[12px] text-foreground/60 tracking-tight leading-[1.55]">
              The style prefix prepended to every image-generation prompt. Defaults
              are hand-drawn black &amp; white sketches (Ridley Scott-style
              storyboards) so the whole bible reads as a single artist&apos;s hand.
              Override any of them to render in a different aesthetic —
              watercolor, painted concept art, 3D blockout, photographic
              reference, whatever fits the project.
            </p>

            {(["storyboard", "portrait", "prop", "poster"] as ImagePromptKind[]).map(
              (kind) => {
                const labels: Record<ImagePromptKind, { title: string; sub: string }> = {
                  storyboard: {
                    title: "Storyboard frames",
                    sub: "Scene-by-scene shot illustrations — landscape 16:9.",
                  },
                  portrait: {
                    title: "Character portraits",
                    sub: "Cast member head-and-shoulders references — square.",
                  },
                  prop: {
                    title: "Prop references",
                    sub: "Isolated prop sketches for the art department — square.",
                  },
                  poster: {
                    title: "Poster concepts",
                    sub: "Tall poster compositions from the Key Art tab — 5:7.",
                  },
                };
                const isModified =
                  imagePrompts[kind].trim() !== DEFAULT_IMAGE_PROMPTS[kind];
                return (
                  <div key={kind} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <label className="text-[13px] font-medium tracking-tight">
                          {labels[kind].title}
                        </label>
                        <p className="text-[11px] text-foreground/55 tracking-tight mt-0.5">
                          {labels[kind].sub}
                        </p>
                      </div>
                      {isModified && (
                        <button
                          onClick={() => handleResetImagePrompt(kind)}
                          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
                          title="Restore the default style prefix"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <textarea
                      value={imagePrompts[kind]}
                      onChange={(e) => handleImagePromptChange(kind, e.target.value)}
                      rows={4}
                      className="w-full rounded-[8px] bg-card/60 shadow-pill px-3 py-2.5 text-[12px] font-mono leading-[1.55] text-foreground/90 placeholder:text-muted-foreground/50 focus:outline-none focus:shadow-paper-hover resize-y"
                      placeholder={DEFAULT_IMAGE_PROMPTS[kind]}
                    />
                  </div>
                );
              },
            )}

            <p className="text-[11px] text-foreground/50 tracking-tight">
              Applies to all new image generations. Already-generated images are
              not retroactively re-rendered. Clear a field and hit Reset to
              restore the default.
            </p>
          </section>
        </DialogContent>
      </Dialog>

      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
    </div>
  );
}
