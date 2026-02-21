"use client";

import { useState } from "react";
import { StepInstructions } from "./step-instructions";
import { StepJsonInput } from "./step-json-input";
import { StepGenerating } from "./step-generating";
import { StepResults } from "./step-results";

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

export function WizardShell() {
  const [currentStep, setCurrentStep] = useState(1);
  const [jsonData, setJsonData] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentResult[]>([
    { name: "Scene Breakdown", slug: "scene-breakdown", status: "pending", content: null, error: null },
    { name: "Production Matrices", slug: "production-matrices", status: "pending", content: null, error: null },
    { name: "Marketing Brief", slug: "marketing-brief", status: "pending", content: null, error: null },
    { name: "Storyboard Prompts", slug: "storyboard-prompts", status: "pending", content: null, error: null },
    { name: "Poster Concepts", slug: "poster-concepts", status: "pending", content: null, error: null },
  ]);

  const handleJsonSubmit = (json: string) => {
    setJsonData(json);
    setCurrentStep(3);
  };

  const handleGenerationComplete = (results: DocumentResult[]) => {
    setDocuments(results);
    setCurrentStep(4);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setJsonData("");
    setDocuments([
      { name: "Scene Breakdown", slug: "scene-breakdown", status: "pending", content: null, error: null },
      { name: "Production Matrices", slug: "production-matrices", status: "pending", content: null, error: null },
      { name: "Marketing Brief", slug: "marketing-brief", status: "pending", content: null, error: null },
      { name: "Storyboard Prompts", slug: "storyboard-prompts", status: "pending", content: null, error: null },
      { name: "Poster Concepts", slug: "poster-concepts", status: "pending", content: null, error: null },
    ]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight">Script to Production</h1>
          <p className="text-sm text-muted-foreground">Generate pre-production documents from your screenplay</p>
        </div>
      </header>

      {/* Step indicator */}
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    currentStep === step.number
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.number
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.number ? "✓" : step.number}
                </div>
                <span
                  className={`text-sm ${
                    currentStep === step.number
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 ${
                    currentStep > step.number ? "bg-primary/40" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <main className="mx-auto max-w-4xl px-6 pb-12">
        {currentStep === 1 && (
          <StepInstructions onNext={() => setCurrentStep(2)} />
        )}
        {currentStep === 2 && (
          <StepJsonInput
            onSubmit={handleJsonSubmit}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <StepGenerating
            jsonData={jsonData}
            documents={documents}
            setDocuments={setDocuments}
            onComplete={handleGenerationComplete}
          />
        )}
        {currentStep === 4 && (
          <StepResults
            documents={documents}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}
