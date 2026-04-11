"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  pickRandomDisplay,
  pickRandomSecondary,
  resolveDisplayFont,
  resolveSecondaryFont,
  googleFontsUrl,
  TOTAL_FONT_COUNT,
  type FontChoice,
} from "@/lib/title-fonts";

type TitleTreatmentProps = {
  title: string;
  tagline?: string;
};

const STORAGE_KEY = "greenlight-title-fonts";

type StoredFonts = { display: string; secondary: string };

function loadStoredFonts(): StoredFonts | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.display === "string" && typeof parsed?.secondary === "string") {
      return parsed;
    }
  } catch {
    // malformed localStorage — fall through to random
  }
  return null;
}

function saveStoredFonts(display: FontChoice, secondary: FontChoice) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ display: display.family, secondary: secondary.family }),
    );
  } catch {
    // storage full — ignore
  }
}

export function TitleTreatment({ title, tagline }: TitleTreatmentProps) {
  // Seed from whatever's in the useState initializer; stable across SSR and
  // the first client render (no random number calls at mount).
  const [displayFont, setDisplayFont] = useState<FontChoice>(() => pickRandomDisplay());
  const [secondaryFont, setSecondaryFont] = useState<FontChoice>(() =>
    pickRandomSecondary(),
  );

  // Hydrate from localStorage on mount. If a pair is saved, restore it.
  // Otherwise, pick a random pair AND persist it so the next mount matches.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = loadStoredFonts();
    if (stored) {
      const d = resolveDisplayFont(stored.display);
      const s = resolveSecondaryFont(stored.secondary);
      if (d && s) {
        setDisplayFont(d);
        setSecondaryFont(s);
        return;
      }
    }
    const d = pickRandomDisplay();
    const s = pickRandomSecondary();
    setDisplayFont(d);
    setSecondaryFont(s);
    saveStoredFonts(d, s);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Dynamically inject a single Google Fonts <link> for just the two selected
  // fonts. Each change replaces the link so we're never loading more than two
  // families at a time.
  const href = useMemo(
    () => googleFontsUrl([displayFont.urlSpec, secondaryFont.urlSpec]),
    [displayFont, secondaryFont],
  );

  useEffect(() => {
    const linkId = "greenlight-title-fonts";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [href]);

  const shuffleBoth = () => {
    const d = pickRandomDisplay(displayFont);
    const s = pickRandomSecondary(secondaryFont);
    setDisplayFont(d);
    setSecondaryFont(s);
    saveStoredFonts(d, s);
  };

  const shuffleDisplay = () => {
    const d = pickRandomDisplay(displayFont);
    setDisplayFont(d);
    saveStoredFonts(d, secondaryFont);
  };

  const shuffleSecondary = () => {
    const s = pickRandomSecondary(secondaryFont);
    setSecondaryFont(s);
    saveStoredFonts(displayFont, s);
  };

  const displayName = title || "The Film";
  const secondaryLine = tagline || "A story you can't look away from";

  return (
    <div className="rounded-xl border border-border/60 bg-card/20 overflow-hidden">
      {/* Preview */}
      <div className="px-8 py-12 md:py-16 flex flex-col items-center justify-center text-center border-b border-border/60 bg-gradient-to-b from-background/40 to-transparent">
        <div
          className="text-foreground leading-[0.95] tracking-tight"
          style={{
            fontFamily: `"${displayFont.family}", serif`,
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
          }}
        >
          {displayName}
        </div>
        <div
          className="text-foreground/75 mt-5 max-w-[52ch]"
          style={{
            fontFamily: `"${secondaryFont.family}", sans-serif`,
            fontWeight: 400,
            fontSize: "20px",
            lineHeight: 1.4,
            letterSpacing: "0.005em",
          }}
        >
          {secondaryLine}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-5 p-4 items-center">
        <FontChip label="Display" font={displayFont} onShuffle={shuffleDisplay} />
        <button
          onClick={shuffleBoth}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground px-3 py-2 rounded-md border border-border hover:border-foreground/30 transition-colors justify-center"
          title={`Shuffle from ${TOTAL_FONT_COUNT.display + TOTAL_FONT_COUNT.secondary} Google Fonts`}
        >
          <RefreshCw size={12} />
          Shuffle both
        </button>
        <FontChip label="Secondary" font={secondaryFont} onShuffle={shuffleSecondary} />
      </div>
    </div>
  );
}

function FontChip({
  label,
  font,
  onShuffle,
}: {
  label: string;
  font: FontChoice;
  onShuffle: () => void;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span
            className="text-[13px] text-foreground truncate"
            style={{ fontFamily: `"${font.family}", system-ui` }}
          >
            {font.family}
          </span>
          <span className="text-[10px] text-muted-foreground/70 truncate">
            {font.category.toLowerCase()}
          </span>
        </div>
      </div>
      <button
        onClick={onShuffle}
        className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        title={`Shuffle ${label.toLowerCase()} font`}
      >
        <RefreshCw size={12} />
      </button>
    </div>
  );
}
