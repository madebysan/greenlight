"use client";

import { useState, useRef } from "react";
import { STAGE_0_PROMPT } from "@/lib/prompts/stage-0";
import { validateScreenplayJson } from "@/lib/schema";
import { SAMPLES } from "@/lib/sample-data";
import { Check, Copy, ChevronDown, Upload, FileText, Loader2 } from "lucide-react";
import { findCachedProject } from "@/lib/cached-projects";

type StepInstructionsProps = {
  onNext: () => void;
  onSubmitJson?: (json: string) => void;
};

export function StepInstructions({ onNext, onSubmitJson }: StepInstructionsProps) {
  const [mode, setMode] = useState<"upload" | "manual">("upload");

  return (
    <div className="max-w-2xl space-y-10">
      {/* Hero */}
      <div>
        <h2 className="text-[2rem] font-semibold tracking-tight mb-3 leading-[1.05]">
          How it works
        </h2>
        <p className="text-[15px] leading-[1.6] text-muted-foreground max-w-[52ch]">
          Upload a screenplay and Greenlight builds your vision deck.
        </p>
      </div>

      {/* Mode switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setMode("upload")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
            mode === "upload"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload size={14} />
          Upload PDF
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
            mode === "manual"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText size={14} />
          Paste JSON
        </button>
      </div>

      {mode === "upload" ? (
        <UploadMode onSubmitJson={onSubmitJson} />
      ) : (
        <ManualMode onNext={onNext} onSubmitJson={onSubmitJson} />
      )}

      {/* Divider + Demo cards */}
      <div className="space-y-4 -mt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">or explore a finished deck</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Night of the Living Dead — feature */}
        <a
          href="/demo"
          className="group block rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover transition-all overflow-hidden"
        >
          <div className="flex items-center gap-5 px-6 py-5">
            <div className="shrink-0 w-[56px] rounded-lg overflow-hidden bg-muted/30" style={{ aspectRatio: "5/7" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/demo-images/poster-f96b783b-8f3.jpg"
                alt="Night of the Living Dead poster sketch"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">
                Feature · 1968
              </div>
              <h3 className="text-[15px] font-medium tracking-tight group-hover:text-foreground transition-colors">
                Night of the Living Dead
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                George A. Romero · Horror · 13 scenes · 5 locations · 8 cast
              </p>
            </div>
            <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
              View deck →
            </span>
          </div>
        </a>

        {/* The Red Balloon — short film */}
        <a
          href="/demo/red-balloon"
          className="group block rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover transition-all overflow-hidden"
        >
          <div className="flex items-center gap-5 px-6 py-5">
            <div className="shrink-0 w-[56px] rounded-lg overflow-hidden bg-muted/30" style={{ aspectRatio: "5/7" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/demo-images/red-balloon/poster-2.jpg"
                alt="The Red Balloon poster sketch"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">
                Short film · 1956
              </div>
              <h3 className="text-[15px] font-medium tracking-tight group-hover:text-foreground transition-colors">
                The Red Balloon
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Albert Lamorisse · Fantasy · 20 scenes · 14 locations · 10 cast
              </p>
            </div>
            <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
              View deck →
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}

// ---- Upload Mode ----

function UploadMode({ onSubmitJson }: { onSubmitJson?: (json: string) => void }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "extracting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map known filenames to cached project titles for fake-gen demo
  const KNOWN_PDFS: Record<string, string> = {
    "everything-everywhere-all-at-once": "Everything Everywhere All At Once",
  };

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(pdf|txt|fdx)$/i)) {
      setError("Please upload a PDF, TXT, or FDX file.");
      setStatus("error");
      return;
    }

    setFileName(file.name);
    setStatus("extracting");
    setError("");

    // Check if this PDF matches a cached project — skip extraction
    const nameSlug = file.name.replace(/\.[^.]+$/, "").toLowerCase();
    for (const [pattern, title] of Object.entries(KNOWN_PDFS)) {
      if (nameSlug.includes(pattern)) {
        const cached = findCachedProject(title);
        if (cached?.jsonData) {
          // Fake a realistic delay
          await new Promise((r) => setTimeout(r, 8000 + Math.random() * 2000));
          setStatus("done");
          onSubmitJson?.(cached.jsonData);
          return;
        }
      }
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-screenplay", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      const { json } = await res.json();

      // Validate
      const result = validateScreenplayJson(json);
      if (!result.valid) {
        throw new Error(`Extraction produced invalid data: ${result.errors[0]}`);
      }

      setStatus("done");
      onSubmitJson?.(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
      setStatus("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (status === "extracting") {
    return (
      <div className="rounded-[12px] bg-card/40 shadow-paper px-6 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 size={24} className="animate-spin text-foreground/60" />
          <div>
            <p className="text-[14px] font-medium text-foreground">
              Reading {fileName}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Extracting scenes, characters, locations, and props. This takes 1–3 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-[12px] border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
          dragOver
            ? "border-foreground/40 bg-foreground/5"
            : "border-border/60 bg-card/40 hover:border-foreground/20"
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Upload size={24} className="text-muted-foreground" />
          <div>
            <p className="text-[14px] font-medium text-foreground">
              Drop your screenplay here
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              PDF or plain text. Claude reads the script and extracts structured data automatically.
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.fdx"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {status === "error" && error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <p className="text-[12px] text-destructive/80">{error}</p>
        </div>
      )}
    </div>
  );
}

// ---- Manual Mode ----

function ManualMode({ onNext, onSubmitJson }: { onNext: () => void; onSubmitJson?: (json: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const hasContent = jsonInput.trim().length > 0;

  const handleGenerate = () => {
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      setErrors(["Please paste your JSON data"]);
      return;
    }
    const result = validateScreenplayJson(trimmed);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    onSubmitJson?.(trimmed);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(STAGE_0_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Step 1 */}
      <div className="rounded-[12px] bg-card/40 shadow-paper px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium shrink-0 mt-0.5">
            1
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-medium tracking-tight mb-1.5">
              Upload your screenplay to Gemini and paste the extraction prompt
            </h3>
            <p className="text-[13px] leading-[1.6] text-muted-foreground mb-3">
              Open{" "}
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 decoration-border hover:decoration-foreground text-foreground"
              >
                Gemini
              </a>
              , select the{" "}
              <span className="text-foreground">Pro</span>{" "}
              model, upload your screenplay, copy the prompt below, and paste it alongside.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-medium transition-colors ${
                  copied
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPrompt ? "Hide prompt" : "Preview prompt"}
                <ChevronDown size={12} className={`transition-transform ${showPrompt ? "rotate-180" : ""}`} />
              </button>
            </div>
            {showPrompt && (
              <div className="relative mt-3">
                <pre className="rounded-lg border border-border/60 bg-background/60 p-4 text-[11px] leading-[1.7] overflow-auto max-h-60 whitespace-pre-wrap font-mono text-foreground/70">
                  {STAGE_0_PROMPT}
                </pre>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-lg bg-gradient-to-t from-card/80 to-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="rounded-[12px] bg-card/40 shadow-paper px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium shrink-0 mt-0.5">
            2
          </span>
          <div>
            <h3 className="text-[15px] font-medium tracking-tight mb-1.5">
              Copy the JSON answer from Gemini
            </h3>
            <p className="text-[13px] leading-[1.6] text-muted-foreground">
              Gemini will return structured JSON with your screenplay data. Select all and copy it.
            </p>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="rounded-[12px] bg-card/40 shadow-paper px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium shrink-0 mt-0.5">
            3
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-medium tracking-tight mb-1.5">
              Paste it here
            </h3>
            <p className="text-[13px] leading-[1.6] text-muted-foreground mb-3">
              Greenlight takes it from there — mood, scenes, locations, cast, and visual concepts.
            </p>

            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                if (errors.length > 0) setErrors([]);
              }}
              placeholder='Paste JSON here — it should start with { "title": ...'
              rows={4}
              className="w-full rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-[12px] font-mono leading-[1.7] text-foreground/85 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/40"
            />

            {!hasContent && SAMPLES.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-[12px] text-muted-foreground">
                <span>Or try with:</span>
                {SAMPLES.map((s, i) => (
                  <span key={s.title}>
                    {i > 0 && <span className="mx-0.5">&middot;</span>}
                    <button
                      onClick={() => setJsonInput(s.json)}
                      className="hover:text-foreground transition-colors underline underline-offset-2"
                    >
                      {s.title}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 mt-3">
                <ul className="space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-[12px] text-destructive/80">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!hasContent}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-[13px] font-medium hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Generate &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
