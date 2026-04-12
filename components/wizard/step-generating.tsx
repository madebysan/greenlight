"use client";

import { useEffect, useRef, useState } from "react";
import { Film } from "lucide-react";
import { SectionLabelPill } from "@/components/ui/inline-chip";
import type { DocumentResult } from "./wizard-shell";

type StepGeneratingProps = {
  apiKey: string;
  jsonData: string;
  documents: DocumentResult[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentResult[]>>;
  onComplete: (results: DocumentResult[]) => void;
  // When provided, skip real API calls and fake the progression using these
  // pre-populated documents. Used for the cached-project "bonus round" demo
  // path where a matching film title already has all its markdown on disk.
  prefilledDocs?: DocumentResult[];
  onStop?: () => void;
};

async function generateOne(
  doc: DocumentResult,
  jsonData: string,
  apiKey: string,
  setDocuments: React.Dispatch<React.SetStateAction<DocumentResult[]>>
): Promise<{ slug: string; content: string | null; error: string | null }> {
  setDocuments((prev) =>
    prev.map((d) =>
      d.slug === doc.slug ? { ...d, status: "generating" as const } : d
    )
  );

  try {
    const res = await fetch(`/api/generate/${doc.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonData, apiKey }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();

    setDocuments((prev) =>
      prev.map((d) =>
        d.slug === doc.slug
          ? { ...d, status: "done" as const, content: data.content, error: null }
          : d
      )
    );

    fetch("/api/save-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: `${doc.slug}.md`, content: data.content }),
    }).catch(() => {});

    return { slug: doc.slug, content: data.content, error: null };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    setDocuments((prev) =>
      prev.map((d) =>
        d.slug === doc.slug
          ? { ...d, status: "error" as const, content: null, error: errMsg }
          : d
      )
    );

    return { slug: doc.slug, content: null, error: errMsg };
  }
}

function formatSeconds(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function StepGenerating({
  apiKey,
  jsonData,
  documents,
  setDocuments,
  onComplete,
  prefilledDocs,
  onStop,
}: StepGeneratingProps) {
  const hasStarted = useRef(false);
  const cancelRef = useRef(false);
  const sessionStartRef = useRef<number>(Date.now());
  // Per-document start and end times so we can show per-row elapsed.
  const docTimesRef = useRef<Record<string, { start?: number; end?: number }>>({});
  const [tick, setTick] = useState(0);

  // Re-render every 200ms so elapsed counters update in real time.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(interval);
  }, []);

  // Track start/end of each document's generation as its status changes.
  useEffect(() => {
    const now = Date.now();
    for (const doc of documents) {
      const entry = docTimesRef.current[doc.slug] || {};
      if (doc.status === "generating" && !entry.start) {
        entry.start = now;
      }
      if ((doc.status === "done" || doc.status === "error") && !entry.end) {
        if (!entry.start) entry.start = now;
        entry.end = now;
      }
      docTimesRef.current[doc.slug] = entry;
    }
  }, [documents]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    sessionStartRef.current = Date.now();

    async function fakeProgression() {
      const FAKE_STEP_MS = 2200;
      const finalDocs: DocumentResult[] = documents.map((d) => ({ ...d }));

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setDocuments((prev) =>
          prev.map((d) =>
            d.slug === doc.slug ? { ...d, status: "generating" as const } : d,
          ),
        );

        await new Promise((r) => setTimeout(r, FAKE_STEP_MS));

        const prefilled = prefilledDocs!.find((p) => p.slug === doc.slug);
        const nextDoc: DocumentResult = prefilled
          ? { ...doc, status: "done", content: prefilled.content, error: null }
          : { ...doc, status: "done", content: null, error: null };

        finalDocs[i] = nextDoc;
        setDocuments((prev) =>
          prev.map((d) => (d.slug === doc.slug ? nextDoc : d)),
        );
      }

      onComplete(finalDocs);
    }

    async function generateSequential() {
      const results: { slug: string; content: string | null; error: string | null }[] = [];

      for (const doc of documents) {
        if (cancelRef.current) break;
        const start = Date.now();
        const result = await generateOne(doc, jsonData, apiKey, setDocuments);
        results.push(result);
        const elapsed = Date.now() - start;
        if (elapsed < 800) await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      const finalDocs = documents.map((doc) => {
        const result = results.find((r) => r.slug === doc.slug);
        if (result) {
          return {
            ...doc,
            status: (result.error ? "error" : "done") as DocumentResult["status"],
            content: result.content,
            error: result.error,
          };
        }
        if (cancelRef.current) {
          return { ...doc, status: "pending" as const };
        }
        return { ...doc, status: "error" as const, error: "Generation failed" };
      });

      setDocuments(finalDocs);
      onComplete(finalDocs);
    }

    if (prefilledDocs && prefilledDocs.length > 0) {
      fakeProgression();
    } else {
      generateSequential();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use `tick` so the linter is happy (referenced) — it's our render trigger.
  void tick;

  const doneCount = documents.filter((d) => d.status === "done").length;
  const errorCount = documents.filter((d) => d.status === "error").length;
  const completed = doneCount + errorCount;
  const total = documents.length;
  const progress = total > 0 ? completed / total : 0;
  const sessionElapsed = Date.now() - sessionStartRef.current;

  return (
    <div className="max-w-3xl space-y-12">
      <header>
        <SectionLabelPill icon={<Film size={10} />} className="mb-4">
          Pre-Production Bible
        </SectionLabelPill>
        <h1 className="text-[44px] font-light tracking-[-0.03em] leading-[1.02] mb-3 text-foreground">
          Assembling documents
        </h1>
        <p className="text-[14px] text-foreground/70 max-w-[58ch] tracking-tight leading-[1.55]">
          Claude is writing your project bible one document at a time. Each one
          is saved to your local workspace the moment it&apos;s ready.
        </p>
      </header>

      {/* Film-strip progress marker */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Progress
            </span>
            <span className="font-mono text-[11px] text-foreground/90 tabular-nums tracking-tight">
              <span className="text-foreground">{completed.toString().padStart(2, "0")}</span>
              <span className="text-muted-foreground"> / {total.toString().padStart(2, "0")}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums tracking-tight">
              {formatSeconds(sessionElapsed)}
            </span>
            <span className="font-mono text-[11px] text-foreground tabular-nums tracking-tight">
              {Math.round(progress * 100)}%
            </span>
            {progress < 1 && !prefilledDocs && (
              <button
                onClick={() => {
                  cancelRef.current = true;
                  onStop?.();
                }}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-destructive hover:text-destructive/80 transition-colors ml-1"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Segmented progress bar — one cell per document, evokes a film strip */}
        <div className="grid gap-px rounded-[6px] overflow-hidden bg-border/40" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
          {documents.map((doc) => {
            const isDone = doc.status === "done";
            const isError = doc.status === "error";
            const isGenerating = doc.status === "generating";
            return (
              <div
                key={doc.slug}
                className={`h-1 relative overflow-hidden ${
                  isDone
                    ? "bg-foreground/90"
                    : isError
                      ? "bg-destructive/70"
                      : isGenerating
                        ? "bg-foreground/40"
                        : "bg-muted/40"
                }`}
              >
                {isGenerating && (
                  <div className="absolute inset-0 shimmer-sweep" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Call-sheet list of documents */}
      <section>
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4 flex items-baseline justify-between">
          <span>Call Sheet</span>
          <span className="text-[9px] tracking-[0.14em]">Document · Status · Elapsed</span>
        </div>
        <ol className="space-y-px">
          {documents.map((doc, i) => {
            const times = docTimesRef.current[doc.slug] || {};
            const isGenerating = doc.status === "generating";
            const isDone = doc.status === "done";
            const isError = doc.status === "error";
            const isPending = doc.status === "pending";

            let elapsedLabel = "—";
            if (isDone || isError) {
              const elapsed = (times.end || Date.now()) - (times.start || Date.now());
              const s = (elapsed / 1000).toFixed(1);
              elapsedLabel = `${s}s`;
            } else if (isGenerating && times.start) {
              const elapsed = Date.now() - times.start;
              const s = (elapsed / 1000).toFixed(1);
              elapsedLabel = `${s}s`;
            }

            return (
              <li
                key={doc.slug}
                className={`relative grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-3.5 rounded-[8px] transition-all ${
                  isGenerating
                    ? "bg-card/60 shadow-paper-hover"
                    : isDone
                      ? "opacity-55"
                      : isError
                        ? "bg-destructive/5"
                        : "opacity-30"
                }`}
              >
                {/* Number */}
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums tracking-[0.1em] w-6">
                  {(i + 1).toString().padStart(2, "0")}
                </span>

                {/* Name */}
                <div className="min-w-0">
                  <div className="text-[13px] font-medium uppercase tracking-[0.04em] text-foreground/90 truncate">
                    {doc.name}
                  </div>
                  {doc.error && (
                    <div className="text-[11px] text-destructive/80 mt-1 truncate">
                      {doc.error}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPending && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Queued
                      </span>
                    </>
                  )}
                  {isGenerating && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
                        Rolling
                      </span>
                    </>
                  )}
                  {isDone && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        In the can
                      </span>
                    </>
                  )}
                  {isError && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-destructive">
                        Failed
                      </span>
                    </>
                  )}
                </div>

                {/* Elapsed */}
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums tracking-tight w-12 text-right">
                  {elapsedLabel}
                </span>

                {/* Sweep shimmer on the currently-rolling row */}
                {isGenerating && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[8px]">
                    <div className="absolute inset-y-0 -left-1/2 w-1/2 shimmer-row" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <style jsx>{`
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmer-row {
          0% { transform: translateX(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(400%); opacity: 0; }
        }
        .shimmer-sweep {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          );
          animation: shimmer-sweep 1.4s ease-in-out infinite;
        }
        .shimmer-row {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 50%,
            transparent 100%
          );
          animation: shimmer-row 2.2s ease-in-out infinite;
        }
        :global(:root:not(.dark)) .shimmer-row {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(23, 23, 23, 0.05) 50%,
            transparent 100%
          );
        }
      `}</style>
    </div>
  );
}
