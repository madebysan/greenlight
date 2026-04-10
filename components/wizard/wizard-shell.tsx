"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Copy, Pencil } from "lucide-react";
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
  type SavedReport,
  type SavedImage,
  loadReports,
  saveReport,
  deleteReport,
  extractTitle,
} from "@/lib/reports";

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
  { name: "Scene Breakdown", slug: "scene-breakdown", status: "pending", content: null, error: null },
  { name: "Production Matrices", slug: "production-matrices", status: "pending", content: null, error: null },
  { name: "Marketing Brief", slug: "marketing-brief", status: "pending", content: null, error: null },
  { name: "Storyboard", slug: "storyboard-prompts", status: "pending", content: null, error: null },
  { name: "Posters", slug: "poster-concepts", status: "pending", content: null, error: null },
];

export function WizardShell() {
  const [hydrated, setHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [apiKey, setApiKey] = useState<string>("");
  const [jsonData, setJsonData] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentResult[]>(INITIAL_DOCS);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [storyboardImages, setStoryboardImages] = useState<Record<number, SavedImage>>({});
  const [promptOverrides, setPromptOverrides] = useState<Record<number, string>>({});
  const [posterImages, setPosterImages] = useState<Record<number, SavedImage>>({});

  // Load reports and API key on mount
  useEffect(() => {
    setReports(loadReports());
    setApiKey(localStorage.getItem("stp-api-key") || "");
    setHydrated(true);
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem("stp-api-key", key);
  };

  const handleJsonSubmit = (json: string) => {
    setJsonData(json);
    setActiveReportId(null);
    setCurrentStep(3);
  };

  const handleGenerationComplete = useCallback(
    (results: DocumentResult[]) => {
      setDocuments(results);
      setCurrentStep(4);

      // Save as a report
      const id = crypto.randomUUID();
      const title = extractTitle(jsonData);
      const report: SavedReport = {
        id,
        title,
        createdAt: new Date().toISOString(),
        jsonData,
        documents: results.map((d) => ({
          name: d.name,
          slug: d.slug,
          status: d.status === "done" ? "done" : "error",
          content: d.content,
          error: d.error,
        })),
      };
      setReports(saveReport(report));
      setActiveReportId(id);
    },
    [jsonData]
  );

  const handleViewReport = (report: SavedReport) => {
    setActiveReportId(report.id);
    if (report.jsonData) setJsonData(report.jsonData);
    setDocuments(
      report.documents.map((d) => ({
        ...d,
        status: d.status as DocumentResult["status"],
      }))
    );
    setStoryboardImages(report.images || {});
    setPromptOverrides(report.promptOverrides || {});
    setPosterImages(report.posterImages || {});
    setCurrentStep(4);
  };

  const handleDownloadAll = () => {
    const completedDocs = documents.filter((d) => d.status === "done");
    completedDocs.forEach((doc) => {
      if (!doc.content) return;
      const blob = new Blob([doc.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.slug}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleDownloadJson = () => {
    if (!jsonData) return;
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "screenplay-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteReport = (id: string) => {
    setReports(deleteReport(id));
    if (activeReportId === id) {
      setActiveReportId(null);
      handleNewReport();
    }
  };

  const handleNewReport = () => {
    setCurrentStep(1);
    setJsonData("");
    setDocuments(INITIAL_DOCS);
    setActiveReportId(null);
    setStoryboardImages({});
    setPromptOverrides({});
    setPosterImages({});
  };

  const handleRenameReport = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const current = loadReports();
    const idx = current.findIndex((r) => r.id === id);
    if (idx < 0) return;
    current[idx].title = trimmed;
    localStorage.setItem("stp-reports", JSON.stringify(current));
    setReports([...current]);
  };

  const handleDuplicateReport = (report: SavedReport) => {
    const id = crypto.randomUUID();
    const duplicate: SavedReport = {
      ...structuredClone(report),
      id,
      title: `${report.title} (copy)`,
      createdAt: new Date().toISOString(),
    };
    setReports(saveReport(duplicate));
    handleViewReport(duplicate);
  };

  // Save all extras to the active report
  const persistExtras = useCallback(
    (extras: { images?: Record<number, SavedImage>; overrides?: Record<number, string>; posters?: Record<number, SavedImage> }) => {
      if (!activeReportId) return;
      const current = loadReports();
      const idx = current.findIndex((r) => r.id === activeReportId);
      if (idx < 0) return;
      if (extras.images !== undefined) current[idx].images = extras.images;
      if (extras.overrides !== undefined) current[idx].promptOverrides = extras.overrides;
      if (extras.posters !== undefined) current[idx].posterImages = extras.posters;
      try {
        localStorage.setItem("stp-reports", JSON.stringify(current));
      } catch {}
    },
    [activeReportId]
  );

  const handleImagesChange = useCallback(
    (images: Record<number, SavedImage>) => {
      setStoryboardImages(images);
      persistExtras({ images });
    },
    [persistExtras]
  );

  const handlePromptOverridesChange = useCallback(
    (overrides: Record<number, string>) => {
      setPromptOverrides(overrides);
      persistExtras({ overrides });
    },
    [persistExtras]
  );

  const handlePosterImagesChange = useCallback(
    (posters: Record<number, SavedImage>) => {
      setPosterImages(posters);
      persistExtras({ posters });
    },
    [persistExtras]
  );

  // Update a specific document's content (e.g., after editing synopsis)
  const handleDocumentUpdate = (slug: string, newContent: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.slug === slug ? { ...d, content: newContent } : d))
    );
  };

  // Regenerate a specific document via the API
  const handleDocumentRewrite = async (slug: string) => {
    if (!jsonData || !apiKey) return;
    const res = await fetch(`/api/generate/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonData, apiKey }),
    });
    if (!res.ok) throw new Error("Rewrite failed");
    const data = await res.json();
    setDocuments((prev) =>
      prev.map((d) => (d.slug === slug ? { ...d, content: data.content } : d))
    );
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const hasReports = reports.length > 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Report history sidebar */}
      {hasReports && sidebarOpen && (
        <aside className="w-56 shrink-0 border-r bg-muted/20 flex flex-col">
          <div className="p-3 border-b flex items-center gap-2">
            <button
              onClick={handleNewReport}
              className="flex-1 text-sm font-medium bg-primary text-primary-foreground rounded-md px-3 py-2 hover:bg-primary/90 transition-colors"
            >
              + New Project
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              title="Collapse sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {reports.map((report) => {
              const isActive = report.id === activeReportId;
              const doneCount = report.documents.filter(
                (d) => d.status === "done"
              ).length;
              const date = new Date(report.createdAt);
              return (
                <div
                  key={report.id}
                  className={`group rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/60 border border-transparent"
                  }`}
                  onClick={() => handleViewReport(report)}
                >
                  {renamingId === report.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRenameReport(report.id, renameValue);
                        setRenamingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => {
                          handleRenameReport(report.id, renameValue);
                          setRenamingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="text-sm font-medium w-full bg-background border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </form>
                  ) : (
                    <div className="text-sm font-medium truncate">
                      {report.title}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      {date.toLocaleDateString()} &middot; {doneCount}/{report.documents.length} docs
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(report.id);
                          setRenameValue(report.title);
                        }}
                        className="text-muted-foreground/50 hover:text-foreground p-0.5 rounded"
                        title="Rename project"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateReport(report); }}
                        className="text-muted-foreground/50 hover:text-foreground p-0.5 rounded"
                        title="Duplicate project"
                      >
                        <Copy size={12} />
                      </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground/50 hover:text-destructive p-0.5 rounded"
                          title="Delete project"
                        >
                          <Trash2 size={12} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete project?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &ldquo;{report.title}&rdquo; and all its generated documents. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteReport(report.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* Collapsed sidebar toggle */}
      {hasReports && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-10 bg-muted/80 hover:bg-muted border border-l-0 rounded-r-md px-1.5 py-3 text-muted-foreground hover:text-foreground transition-colors"
          title="Show projects"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="border-b bg-background/95 backdrop-blur-sm">
          <div className={`mx-auto px-6 py-4 ${currentStep === 4 ? "max-w-6xl" : "max-w-4xl"}`}>
            <div className="flex items-center gap-3">
              {/* Simple icon */}
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Script to Production
                </h1>
                <p className="text-[13px] text-muted-foreground">
                  Generate pre-production documents from your screenplay
                </p>
              </div>
              {/* Download actions on results step */}
              {currentStep === 4 && (
                <div className="flex items-center gap-2 ml-auto">
                  {jsonData && (
                    <button
                      onClick={handleDownloadJson}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-foreground/20 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      JSON
                    </button>
                  )}
                  {documents.some((d) => d.status === "done") && (
                    <button
                      onClick={handleDownloadAll}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-foreground/20 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download All
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Step indicator */}
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

        {/* Step content */}
        <main
          className={`mx-auto px-6 pb-12 ${
            currentStep === 4 ? "max-w-6xl" : "max-w-4xl"
          }`}
        >
          {currentStep === 1 && (
            <StepInstructions
              apiKey={apiKey}
              onApiKeyChange={handleApiKeyChange}
              onNext={() => setCurrentStep(2)}
            />
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
            />
          )}
          {currentStep === 4 && (
            <StepResults
              documents={documents}
              onStartOver={handleNewReport}
              onDocumentUpdate={handleDocumentUpdate}
              onDocumentRewrite={handleDocumentRewrite}
              storyboardImages={storyboardImages}
              onStoryboardImagesChange={handleImagesChange}
              promptOverrides={promptOverrides}
              onPromptOverridesChange={handlePromptOverridesChange}
              posterImages={posterImages}
              onPosterImagesChange={handlePosterImagesChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}
