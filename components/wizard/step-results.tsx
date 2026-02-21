"use client";

import { Button } from "@/components/ui/button";
import type { DocumentResult } from "./wizard-shell";

type StepResultsProps = {
  documents: DocumentResult[];
  onStartOver: () => void;
};

export function StepResults({ documents, onStartOver }: StepResultsProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Results</h2>
      <p className="text-muted-foreground mb-6">Placeholder — will show tabbed document viewer.</p>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.slug} className="text-sm">
            {doc.name}: {doc.status}
          </div>
        ))}
      </div>
      <Button className="mt-6" onClick={onStartOver}>Start Over</Button>
    </div>
  );
}
