"use client";

import { useEffect, useState } from "react";
import { Clock, DollarSign, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ApiKeysDialogProps = {
  open: boolean;
  requireFal: boolean;
  initialApiKey: string;
  initialFalKey: string;
  initialTmdbKey: string;
  onConfirm: (apiKey: string, falKey: string, tmdbKey: string) => void;
  onCancel: () => void;
};

export function ApiKeysDialog({
  open,
  requireFal,
  initialApiKey,
  initialFalKey,
  initialTmdbKey,
  onConfirm,
  onCancel,
}: ApiKeysDialogProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [falKey, setFalKey] = useState(initialFalKey);
  const [tmdbKey, setTmdbKey] = useState(initialTmdbKey);

  // When the dialog (re)opens, sync from the provider's latest values.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setApiKey(initialApiKey);
      setFalKey(initialFalKey);
      setTmdbKey(initialTmdbKey);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, initialApiKey, initialFalKey, initialTmdbKey]);

  const claudeOk = apiKey.trim().length > 0;
  const falOk = falKey.trim().length > 0;
  const canSubmit = claudeOk && (!requireFal || falOk);

  const estCost = falOk ? "~$2–3" : "~$0.70";
  const estTime = falOk ? "~3–5 minutes" : "~2–4 minutes";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="tracking-tight flex items-center gap-2">
            <Key size={16} className="text-muted-foreground" />
            {requireFal ? "fal.ai key needed" : "Add your API keys"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {!requireFal && (
            <div className="rounded-[10px] bg-muted/40 px-4 py-3.5 space-y-2">
              <p className="text-[12px] text-foreground/70 leading-[1.55] tracking-tight">
                Greenlight runs on your keys — they stay in your browser and go
                straight to Anthropic and fal.ai. Nothing is sent to a Greenlight
                server.
              </p>
              <div className="flex items-center gap-4 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/70">
                  <Clock size={11} /> {estTime}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/70">
                  <DollarSign size={11} /> {estCost} per screenplay
                </span>
              </div>
            </div>
          )}

          {/* Claude */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[13px] font-medium tracking-tight">
                Claude API key{" "}
                <span className="text-muted-foreground font-normal">· required</span>
              </label>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Get a key ↗
              </a>
            </div>
            <p className="text-[11.5px] text-foreground/60 tracking-tight leading-[1.5]">
              Used to read your screenplay PDF and write every document in the deck.
            </p>
            <input
              type="password"
              placeholder="sk-ant-api03-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoFocus={!apiKey}
              className="w-full rounded-[8px] bg-card/60 shadow-pill px-3 py-2.5 text-[13px] font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:shadow-paper-hover"
            />
          </div>

          {/* fal.ai */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[13px] font-medium tracking-tight">
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
            <p className="text-[11.5px] text-foreground/60 tracking-tight leading-[1.5]">
              {requireFal
                ? "Needed to generate this image. Your deck’s documents don’t need this key."
                : "Add this to generate storyboards, character portraits, props, and poster concepts. Leave blank for a text-only deck."}
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
                <label className="text-[13px] font-medium tracking-tight">
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
              <p className="text-[11.5px] text-foreground/60 tracking-tight leading-[1.5]">
                Resolves poster thumbnails for Similar Moods and Soundtrack References on the Mood &amp; Tone tab. Free to get.
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

          <p className="text-[11px] text-foreground/45 tracking-tight leading-[1.5]">
            Keys are stored in your browser only — never transmitted to a
            Greenlight server. Edit them anytime from Settings.
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
                onConfirm(apiKey.trim(), falKey.trim(), tmdbKey.trim())
              }
              disabled={!canSubmit}
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg text-[13px] font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {requireFal && !claudeOk
                ? "Add both keys to continue"
                : "Save & continue"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
