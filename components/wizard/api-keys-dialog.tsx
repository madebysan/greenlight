"use client";

import { useEffect, useState } from "react";
import { Clock, DollarSign, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTextProviderOption, type TextProvider } from "@/lib/ai-providers";
import { TextProviderFields } from "@/components/wizard/text-provider-fields";

type ApiKeysDialogProps = {
  open: boolean;
  requireFal: boolean;
  initialApiProvider: TextProvider;
  initialApiKey: string;
  initialFalKey: string;
  initialTmdbKey: string;
  onConfirm: (
    apiProvider: TextProvider,
    apiKey: string,
    falKey: string,
    tmdbKey: string,
  ) => void;
  onCancel: () => void;
};

export function ApiKeysDialog({
  open,
  requireFal,
  initialApiProvider,
  initialApiKey,
  initialFalKey,
  initialTmdbKey,
  onConfirm,
  onCancel,
}: ApiKeysDialogProps) {
  const [apiProvider, setApiProvider] = useState<TextProvider>(initialApiProvider);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [falKey, setFalKey] = useState(initialFalKey);
  const [tmdbKey, setTmdbKey] = useState(initialTmdbKey);

  // When the dialog (re)opens, sync from the provider's latest values.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setApiProvider(initialApiProvider);
      setApiKey(initialApiKey);
      setFalKey(initialFalKey);
      setTmdbKey(initialTmdbKey);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, initialApiProvider, initialApiKey, initialFalKey, initialTmdbKey]);

  const providerOption = getTextProviderOption(apiProvider);
  const textProviderOk = apiKey.trim().length > 0;
  const falOk = falKey.trim().length > 0;
  const canSubmit = textProviderOk && (!requireFal || falOk);

  const estCost = falOk ? "Text + images" : "Text only";
  const estTime = falOk ? "~3–5 minutes" : "~2–4 minutes";

  const handleProviderChange = (nextProvider: TextProvider) => {
    if (nextProvider === apiProvider) return;
    setApiProvider(nextProvider);
    setApiKey("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="tracking-normal flex items-center gap-2">
            <Key size={16} className="text-muted-foreground" />
            {requireFal ? "fal.ai key required" : "Add API keys"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose one text provider and add the keys needed for this request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {!requireFal && (
            <div className="rounded-[10px] bg-muted/40 px-4 py-3.5 space-y-2">
              <p className="text-[12px] text-foreground/70 leading-[1.55] tracking-normal">
                Your keys are saved in this browser. Greenlight sends them only
                for the request you run and does not store them on its server.
              </p>
              <div className="flex items-center gap-4 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/70">
                  <Clock size={11} /> {estTime}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/70">
                  <DollarSign size={11} /> {providerOption.label} · {estCost}
                </span>
              </div>
            </div>
          )}

          <TextProviderFields
            provider={apiProvider}
            apiKey={apiKey}
            onProviderChange={handleProviderChange}
            onApiKeyChange={setApiKey}
            autoFocus={!apiKey}
          />

          {/* fal.ai */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[13px] font-medium tracking-normal">
                fal.ai API key{" "}
                <span className="text-muted-foreground font-normal">
                  · {requireFal ? "required for images" : "optional"}
                </span>
              </label>
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Get a key ↗
              </a>
            </div>
            <p className="text-[11.5px] text-foreground/60 tracking-normal leading-[1.5]">
              {requireFal
                ? "Needed for this image only."
                : "Generates images. Leave blank for text only."}
            </p>
            <input
              type="password"
              placeholder="fal-..."
              value={falKey}
              onChange={(e) => setFalKey(e.target.value)}
              autoFocus={!!apiKey && requireFal && !falKey}
              className="w-full rounded-[8px] bg-card/60 shadow-pill px-3 py-2.5 text-[13px] font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:shadow-paper-hover"
            />
          </div>

          {/* TMDB — only shown on the general onboarding modal, not when a
              specific action is asking for fal credentials. */}
          {!requireFal && (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <label className="text-[13px] font-medium tracking-normal">
                  TMDB API key{" "}
                  <span className="text-muted-foreground font-normal">· optional</span>
                </label>
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Get a key ↗
                </a>
              </div>
              <p className="text-[11.5px] text-foreground/60 tracking-normal leading-[1.5]">
                Adds poster thumbnails. Optional.
              </p>
              <input
                type="password"
                placeholder="TMDB API key (v3 auth)"
                value={tmdbKey}
                onChange={(e) => setTmdbKey(e.target.value)}
                className="w-full rounded-[8px] bg-card/60 shadow-pill px-3 py-2.5 text-[13px] font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:shadow-paper-hover"
              />
            </div>
          )}

          <p className="text-[11px] text-foreground/45 tracking-normal leading-[1.5]">
            Edit keys anytime from Settings. They stay in this browser.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                canSubmit &&
                onConfirm(apiProvider, apiKey.trim(), falKey.trim(), tmdbKey.trim())
              }
              disabled={!canSubmit}
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg text-[13px] font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {requireFal && (!textProviderOk || !falOk)
                ? "Add required keys"
                : "Save and continue"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
