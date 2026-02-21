"use client";

import { useEffect, useRef } from "react";
import type { DocumentResult } from "./wizard-shell";

type StepGeneratingProps = {
  jsonData: string;
  documents: DocumentResult[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentResult[]>>;
  onComplete: (results: DocumentResult[]) => void;
};

const STATUS_ICON: Record<DocumentResult["status"], string> = {
  pending: "\u25CB",    // empty circle
  generating: "\u25CF", // filled circle
  done: "\u2713",       // checkmark
  error: "\u2717",      // x mark
};

const STATUS_COLOR: Record<DocumentResult["status"], string> = {
  pending: "text-muted-foreground",
  generating: "text-primary animate-pulse",
  done: "text-green-600",
  error: "text-destructive",
};

async function generateOne(
  doc: DocumentResult,
  jsonData: string,
  setDocuments: React.Dispatch<React.SetStateAction<DocumentResult[]>>
): Promise<{ slug: string; content: string | null; error: string | null }> {
  // Mark as generating
  setDocuments((prev) =>
    prev.map((d) =>
      d.slug === doc.slug ? { ...d, status: "generating" as const } : d
    )
  );

  try {
    const res = await fetch(`/api/generate/${doc.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonData }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();

    // Mark as done
    setDocuments((prev) =>
      prev.map((d) =>
        d.slug === doc.slug
          ? { ...d, status: "done" as const, content: data.content, error: null }
          : d
      )
    );

    // Auto-save to ~/Desktop/script-to-production/
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

export function StepGenerating({
  jsonData,
  documents,
  setDocuments,
  onComplete,
}: StepGeneratingProps) {
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function generateSequential() {
      const results: { slug: string; content: string | null; error: string | null }[] = [];

      // Generate one at a time to avoid rate limits
      for (const doc of documents) {
        const result = await generateOne(doc, jsonData, setDocuments);
        results.push(result);
      }

      // Build final state and advance
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
        return { ...doc, status: "error" as const, error: "Generation failed" };
      });

      setDocuments(finalDocs);
      onComplete(finalDocs);
    }

    generateSequential();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = documents.filter((d) => d.status === "done").length;
  const errorCount = documents.filter((d) => d.status === "error").length;
  const currentDoc = documents.find((d) => d.status === "generating");
  const progress = ((doneCount + errorCount) / documents.length) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Generating Documents</h2>
        <p className="text-[15px] text-muted-foreground">
          Creating your pre-production documents one at a time.
          {currentDoc && (
            <span className="text-foreground font-medium">
              {" "}Currently generating: {currentDoc.name}
            </span>
          )}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{doneCount} of {documents.length} complete</span>
          <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.slug}
            className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
              doc.status === "generating"
                ? "border-primary/30 bg-primary/5 shadow-sm"
                : doc.status === "done"
                  ? "bg-green-50/50 border-green-200/50"
                  : doc.status === "error"
                    ? "bg-destructive/5 border-destructive/20"
                    : ""
            }`}
          >
            <span className={`text-lg ${STATUS_COLOR[doc.status]}`}>
              {STATUS_ICON[doc.status]}
            </span>
            <div className="flex-1">
              <span className="text-sm font-medium">{doc.name}</span>
              {doc.error && (
                <p className="text-xs text-destructive mt-0.5">{doc.error}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {doc.status === "generating" ? "generating..." : doc.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
