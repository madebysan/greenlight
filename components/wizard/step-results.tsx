"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/document-viewer";
import { Download } from "lucide-react";
import { SceneBreakdownViewer } from "@/components/viewers/scene-breakdown-viewer";
import { ProductionMatricesViewer } from "@/components/viewers/production-matrices-viewer";
import { MarketingBriefViewer } from "@/components/viewers/marketing-brief-viewer";
import { StoryboardViewer } from "@/components/viewers/storyboard-viewer";
import { PosterConceptsViewer } from "@/components/viewers/poster-concepts-viewer";
import type { DocumentResult } from "./wizard-shell";
import type { SavedImage } from "@/lib/reports";

type StepResultsProps = {
  documents: DocumentResult[];
  jsonData?: string;
  onStartOver: () => void;
  onDocumentUpdate?: (slug: string, newContent: string) => void;
  onDocumentRewrite?: (slug: string) => Promise<void>;
  storyboardImages: Record<number, SavedImage>;
  onStoryboardImagesChange: (images: Record<number, SavedImage>) => void;
  promptOverrides: Record<number, string>;
  onPromptOverridesChange: (overrides: Record<number, string>) => void;
  posterImages: Record<number, SavedImage>;
  onPosterImagesChange: (images: Record<number, SavedImage>) => void;
  portraits: Record<string, SavedImage>;
  onPortraitsChange: (portraits: Record<string, SavedImage>) => void;
};

export function StepResults({ documents, jsonData, onStartOver, onDocumentUpdate, onDocumentRewrite, storyboardImages, onStoryboardImagesChange, promptOverrides, onPromptOverridesChange, posterImages, onPosterImagesChange, portraits, onPortraitsChange }: StepResultsProps) {
  const completedDocs = documents.filter((doc) => doc.status === "done");
  const failedDocs = documents.filter((doc) => doc.status === "error");
  const [activeSlug, setActiveSlug] = useState(
    completedDocs.length > 0 ? completedDocs[0].slug : ""
  );

  const activeDoc = completedDocs.find((d) => d.slug === activeSlug);

  const handleDownloadOne = (doc: DocumentResult) => {
    if (!doc.content) return;
    const blob = new Blob([doc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {failedDocs.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive mb-2">
            Some documents failed to generate:
          </p>
          <ul className="space-y-1">
            {failedDocs.map((doc) => (
              <li key={doc.slug} className="text-sm text-destructive/80">
                {doc.name}: {doc.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Horizontal tabs + content */}
      {completedDocs.length > 0 && (
        <div className="min-h-[600px]">
          {/* Horizontal tab navigation */}
          <div className="flex items-center gap-1 border-b mb-0">
            {completedDocs.map((doc) => {
              const isActive = doc.slug === activeSlug;
              return (
                <button
                  key={doc.slug}
                  onClick={() => setActiveSlug(doc.slug)}
                  className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors rounded-t-lg ${
                    isActive
                      ? "text-foreground bg-muted/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  {doc.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
            {/* Download button aligned right */}
            {activeDoc && (
              <button
                onClick={() => handleDownloadOne(activeDoc)}
                className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors"
              >
                <Download size={14} />
                Download
              </button>
            )}
          </div>

          {/* Document content */}
          <div className="rounded-b-lg border border-t-0 overflow-hidden">
            <div className="overflow-y-auto p-6">
              {activeDoc?.content && (() => {
                switch (activeDoc.slug) {
                  case "scene-breakdown":
                    return (
                      <SceneBreakdownViewer
                        content={activeDoc.content}
                        onContentChange={onDocumentUpdate ? (c) => onDocumentUpdate("scene-breakdown", c) : undefined}
                      />
                    );
                  case "production-matrices":
                    return (
                      <ProductionMatricesViewer
                        content={activeDoc.content}
                        savedPortraits={portraits}
                        onPortraitsChange={onPortraitsChange}
                      />
                    );
                  case "marketing-brief":
                    return (
                      <MarketingBriefViewer
                        content={activeDoc.content}
                        jsonData={jsonData}
                        onContentChange={onDocumentUpdate ? (c) => onDocumentUpdate("marketing-brief", c) : undefined}
                        onRewrite={onDocumentRewrite ? () => onDocumentRewrite("marketing-brief") : undefined}
                      />
                    );
                  case "storyboard-prompts":
                    return (
                      <StoryboardViewer
                        content={activeDoc.content}
                        savedImages={storyboardImages}
                        onImagesChange={onStoryboardImagesChange}
                        savedPromptOverrides={promptOverrides}
                        onPromptOverridesChange={onPromptOverridesChange}
                      />
                    );
                  case "poster-concepts":
                    return (
                      <PosterConceptsViewer
                        content={activeDoc.content}
                        savedImages={posterImages}
                        onImagesChange={onPosterImagesChange}
                      />
                    );
                  default:
                    return <DocumentViewer content={activeDoc.content} />;
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {completedDocs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No documents were generated. Try again with different input.
          </p>
          <Button className="mt-4" onClick={onStartOver}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
