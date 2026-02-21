"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DocumentViewer } from "@/components/document-viewer";
import type { DocumentResult } from "./wizard-shell";

type StepResultsProps = {
  documents: DocumentResult[];
  onStartOver: () => void;
};

export function StepResults({ documents, onStartOver }: StepResultsProps) {
  const completedDocs = documents.filter((doc) => doc.status === "done");
  const failedDocs = documents.filter((doc) => doc.status === "error");

  const handleDownloadAll = () => {
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

  const defaultTab = completedDocs.length > 0 ? completedDocs[0].slug : "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Your Documents</h2>
          <p className="text-muted-foreground">
            {completedDocs.length} of {documents.length} documents generated
            {failedDocs.length > 0 && (
              <span className="text-destructive">
                {" "} ({failedDocs.length} failed)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {completedDocs.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleDownloadAll}>
              Download All
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onStartOver}>
            Start Over
          </Button>
        </div>
      </div>

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

      {completedDocs.length > 0 && (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
            {completedDocs.map((doc) => (
              <TabsTrigger
                key={doc.slug}
                value={doc.slug}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm border"
              >
                {doc.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {completedDocs.map((doc) => (
            <TabsContent key={doc.slug} value={doc.slug} className="mt-6">
              <div className="rounded-lg border p-6">
                {doc.content && (
                  <DocumentViewer content={doc.content} name={doc.name} />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {completedDocs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No documents were generated. Try again with different input.
          </p>
          <Button className="mt-4" onClick={onStartOver}>
            Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
