"use client";

import type { DocumentResult } from "./wizard-shell";

type StepGeneratingProps = {
  jsonData: string;
  documents: DocumentResult[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentResult[]>>;
  onComplete: (results: DocumentResult[]) => void;
};

export function StepGenerating({ documents }: StepGeneratingProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Generating Documents...</h2>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.slug} className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="text-sm">{doc.name}</span>
            <span className="text-xs text-muted-foreground">{doc.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
