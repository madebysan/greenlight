"use client";

import { Button } from "@/components/ui/button";

type StepJsonInputProps = {
  onSubmit: (json: string) => void;
  onBack: () => void;
};

export function StepJsonInput({ onSubmit, onBack }: StepJsonInputProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Step 2: Paste JSON</h2>
      <p className="text-muted-foreground mb-6">Placeholder — will be implemented next.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={() => onSubmit("{}")}>Generate Documents</Button>
      </div>
    </div>
  );
}
