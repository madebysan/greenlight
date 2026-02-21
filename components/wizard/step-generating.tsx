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
  generating: "\u25CF", // filled circle (animated via CSS)
  done: "\u2713",       // checkmark
  error: "\u2717",      // x mark
};

const STATUS_COLOR: Record<DocumentResult["status"], string> = {
  pending: "text-muted-foreground",
  generating: "text-primary animate-pulse",
  done: "text-green-600",
  error: "text-destructive",
};

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

    async function generateAll() {
      // Mark all as generating
      setDocuments((prev) =>
        prev.map((doc) => ({ ...doc, status: "generating" as const }))
      );

      // Fire all 5 in parallel
      const promises = documents.map(async (doc) => {
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
          return { slug: doc.slug, content: data.content, error: null };
        } catch (error) {
          return {
            slug: doc.slug,
            content: null,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      // Update each doc as it completes
      const results = await Promise.allSettled(promises);

      const updatedDocs = documents.map((doc) => {
        const result = results.find((r) => {
          if (r.status === "fulfilled") return r.value.slug === doc.slug;
          return false;
        });

        if (result && result.status === "fulfilled") {
          const val = result.value;
          return {
            ...doc,
            status: (val.error ? "error" : "done") as DocumentResult["status"],
            content: val.content,
            error: val.error,
          };
        }

        return { ...doc, status: "error" as const, error: "Generation failed" };
      });

      setDocuments(updatedDocs);
      onComplete(updatedDocs);
    }

    generateAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Generating Documents</h2>
        <p className="text-muted-foreground">
          Running 5 parallel AI calls. This usually takes 15-30 seconds.
        </p>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.slug}
            className="flex items-center gap-3 rounded-lg border p-4"
          >
            <span className={`text-lg ${STATUS_COLOR[doc.status]}`}>
              {STATUS_ICON[doc.status]}
            </span>
            <div className="flex-1">
              <span className="text-sm font-medium">{doc.name}</span>
              {doc.error && (
                <p className="text-xs text-destructive mt-1">{doc.error}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {doc.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
