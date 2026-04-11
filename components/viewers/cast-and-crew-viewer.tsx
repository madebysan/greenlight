"use client";

import { useState, useRef, useMemo } from "react";
import { Loader2, Camera, RefreshCw, Images, X, EyeOff, Eye, Users, Lightbulb } from "lucide-react";
import { SectionLabelPill } from "@/components/ui/inline-chip";
import { getStylePrefix } from "@/lib/image-prompts";
import type { SavedImage } from "@/lib/reports";

type CharacterData = {
  name: string;
  description: string;
  arc_summary: string;
  scenes_present: number[];
  special_requirements?: string[];
  wardrobe_changes?: number;
};

type PortraitState = { status: "idle" | "generating" | "done" | "error"; url?: string };

type CastAndCrewViewerProps = {
  jsonData: string;
  portraits: Record<string, SavedImage>;
  onPortraitsChange: (portraits: Record<string, SavedImage>) => void;
  disabledItems: Record<string, boolean>;
  onDisabledItemsChange: (items: Record<string, boolean>) => void;
};

type ScreenplayData = {
  characters?: CharacterData[];
  scenes?: Array<{
    slug_line?: string;
    vfx_stunts?: string[];
    props?: string[];
    int_ext?: string;
    time_of_day?: string;
  }>;
  locations?: unknown[];
  setting_period?: string;
};

function parseData(jsonData: string): ScreenplayData {
  try {
    return JSON.parse(jsonData) as ScreenplayData;
  } catch {
    return {};
  }
}

type Insight = {
  key: string;
  title: string;
  signal: string;
  recommendation: string;
};

// Situational production insights derived from the screenplay.
// Deliberately skips baseline roles (director, DP, producer, etc.) — those are
// assumed. This surfaces the non-obvious specialty hires a line producer would
// flag on a first read.
function computeInsights(data: ScreenplayData): Insight[] {
  const scenes = data.scenes || [];
  const characters = data.characters || [];
  const locations = data.locations || [];
  const insights: Insight[] = [];

  const allVfxStunts = scenes.flatMap((s) => s.vfx_stunts || []);
  const allProps = scenes.flatMap((s) => s.props || []);
  const allSpecialReqs = characters.flatMap((c) => c.special_requirements || []);
  const allCharText = characters.map((c) => `${c.name} ${c.description || ""}`).join(" ");
  const allSlugs = scenes.map((s) => s.slug_line || "").join(" ");

  const matches = (pattern: RegExp, pools: string[][]) =>
    pools.flat().filter((s) => pattern.test(s));

  // --- Safety / specialty ---

  const stuntHits = matches(/stunt|fight|fall|combat|squib|chase|punch|brawl/i, [allVfxStunts, allSpecialReqs]);
  if (stuntHits.length > 0) {
    insights.push({
      key: "stunts",
      title: "Stunt work",
      signal: `${stuntHits.length} stunt cue${stuntHits.length > 1 ? "s" : ""} flagged`,
      recommendation:
        "Bring on a Stunt Coordinator. Safety and choreography are non-negotiable — budget for rehearsal days and stunt performers who match your cast.",
    });
  }

  const vfxHits = matches(/vfx|cgi|visual effect|digital|composit|green[- ]?screen/i, [allVfxStunts]);
  if (vfxHits.length > 0) {
    insights.push({
      key: "vfx",
      title: "Visual effects",
      signal: `${vfxHits.length} scene${vfxHits.length > 1 ? "s" : ""} need digital or compositing work`,
      recommendation:
        "Bring in a VFX Supervisor during prep — shots need to be planned on set, not fixed in post. Even a small vendor beats winging it.",
    });
  }

  const sfxHits = matches(/prosthetic|make[- ]?up|blood|wound|burn|gore|scar/i, [allVfxStunts, allSpecialReqs]);
  if (sfxHits.length > 0) {
    insights.push({
      key: "sfx-makeup",
      title: "Practical makeup",
      signal: `${sfxHits.length} cue${sfxHits.length > 1 ? "s" : ""} for prosthetics, blood, or wounds`,
      recommendation:
        "Hire an SFX Makeup Artist. These are slow setups — budget extra chair time per shoot day and run a test well before principal photography.",
    });
  }

  const weaponHits = matches(/\b(gun|pistol|rifle|firearm|revolver|shotgun|weapon|knife|blade)\b/i, [
    allProps,
    allVfxStunts,
    allSpecialReqs,
  ]);
  if (weaponHits.length > 0) {
    insights.push({
      key: "weapons",
      title: "Weapons on set",
      signal: `${weaponHits.length} reference${weaponHits.length > 1 ? "s" : ""} to firearms or blades`,
      recommendation:
        "Hire a licensed Armorer. Post-Rust, insurance carriers and union cast expect this on any set with prop weapons — no exceptions.",
    });
  }

  const pyroHits = matches(/fire|flame|explosion|pyro|burn/i, [allVfxStunts]);
  if (pyroHits.length > 0) {
    insights.push({
      key: "pyro",
      title: "Fire or pyrotechnics",
      signal: `${pyroHits.length} scene${pyroHits.length > 1 ? "s" : ""} with fire or explosive effects`,
      recommendation:
        "Licensed Pyrotechnician required. That pulls in permits, a fire marshal on set, and safety rehearsals — it will shape your location list.",
    });
  }

  const waterHits = matches(/underwater|swim|drown|ocean|river|pool|rain/i, [allVfxStunts, allSpecialReqs]);
  const waterSlugHits = /underwater|ocean|river|pool|lake/i.test(allSlugs) ? 1 : 0;
  if (waterHits.length > 0 || waterSlugHits > 0) {
    insights.push({
      key: "water",
      title: "Water & weather",
      signal: "Water work or weather-dependent scenes",
      recommendation:
        "Budget for a Marine Coordinator or Water Safety. These days eat the schedule — put them early in the shoot so you have room for reshoots.",
    });
  }

  const intimacyHits = matches(/intimacy|intimate|sex|nude|nudity|love scene/i, [allSpecialReqs, allVfxStunts]);
  if (intimacyHits.length > 0) {
    insights.push({
      key: "intimacy",
      title: "Intimate scenes",
      signal: `${intimacyHits.length} moment${intimacyHits.length > 1 ? "s" : ""} flagged as intimate`,
      recommendation:
        "Hire an Intimacy Coordinator. Standard practice on every union set now — it protects the cast and produces cleaner performances.",
    });
  }

  // --- Animals & vehicles ---

  const animalInText = /\b(dog|cat|horse|puppy|wolf|bird|snake|animal)\b/i;
  const hasAnimal = animalInText.test(allCharText) || matches(animalInText, [allProps, allSpecialReqs]).length > 0;
  if (hasAnimal) {
    insights.push({
      key: "animals",
      title: "Animals on camera",
      signal: "Script references trained animals",
      recommendation:
        "Hire an Animal Wrangler from an AHA-monitored service. Animals need rehearsal days and backup plans — never improvise on the day.",
    });
  }

  const vehicleHits = matches(/\b(car chase|motorcycle|crash|driving sequence|picture car)\b/i, [
    allVfxStunts,
    allProps,
  ]);
  if (vehicleHits.length > 0) {
    insights.push({
      key: "vehicles",
      title: "Picture cars",
      signal: "Hero driving or vehicle stunts",
      recommendation:
        "Bring in a Picture Car Coordinator. Rigs, process trailers, and tow vehicles have long lead times and specialty drivers who aren't your 2nd unit.",
    });
  }

  // --- Production logistics ---

  const nightScenes = scenes.filter((s) => s.time_of_day === "NIGHT").length;
  if (nightScenes >= 3) {
    insights.push({
      key: "night",
      title: "Night shoots",
      signal: `${nightScenes} night scene${nightScenes > 1 ? "s" : ""}`,
      recommendation:
        "Upsize the Gaffer and lighting package. Night exteriors especially — condors, HMI balance, and longer turnaround days between wraps and calls.",
    });
  }

  const exteriorScenes = scenes.filter((s) => s.int_ext === "EXT" || s.int_ext === "BOTH").length;
  if (exteriorScenes >= 3) {
    insights.push({
      key: "exteriors",
      title: "Heavy exterior footprint",
      signal: `${exteriorScenes} exterior scene${exteriorScenes > 1 ? "s" : ""}`,
      recommendation:
        "Dedicated Location Manager. Permits, parking, weather contingency, and neighborhood relations is a full-time job on any film this size.",
    });
  }

  if (locations.length >= 6) {
    insights.push({
      key: "many-locations",
      title: "Location density",
      signal: `${locations.length} unique locations`,
      recommendation:
        "Consider a dedicated Line Producer. Every company move costs roughly half a shoot day — a heavy location list needs someone watching that math.",
    });
  }

  if (characters.length >= 6) {
    insights.push({
      key: "large-cast",
      title: "Large ensemble",
      signal: `${characters.length} principal characters`,
      recommendation:
        "Hire a Casting Director. Even with name attachments, casting the supporting ensemble goes faster with someone who knows the current talent pools.",
    });
  }

  const childPattern = /\b(child|kid|boy|girl|baby|toddler|teen|minor|young)\b/i;
  if (characters.some((c) => childPattern.test(c.description || ""))) {
    insights.push({
      key: "minors",
      title: "Minors on set",
      signal: "Child or teen characters",
      recommendation:
        "Studio Teacher and Welfare Worker required. Shoot days are capped by law — it will affect your schedule before it affects anything else.",
    });
  }

  // --- Performance / period ---

  const danceHits = matches(/danc|sing|choreograph|musical/i, [allSpecialReqs, allVfxStunts]);
  if (danceHits.length > 0) {
    insights.push({
      key: "movement",
      title: "Movement or music",
      signal: "Dance or musical performance required",
      recommendation:
        "Hire a Choreographer and lock rehearsals well before principal photography. These scenes almost always need more prep than anyone plans for.",
    });
  }

  if (data.setting_period && /\b(1[0-9]\d\d|20[0-1]\d|ancient|medieval|victorian|regency|antebellum)\b/i.test(data.setting_period)) {
    insights.push({
      key: "period",
      title: "Period piece",
      signal: `Set in ${data.setting_period}`,
      recommendation:
        "Research-heavy production design and custom wardrobe. Factor in build lead time and vet locations that won't fight you on period accuracy.",
    });
  }

  return insights;
}

export function CastAndCrewViewer({
  jsonData,
  portraits,
  onPortraitsChange,
  disabledItems,
  onDisabledItemsChange,
}: CastAndCrewViewerProps) {
  const toggleDisabled = (key: string) => {
    const next = { ...disabledItems };
    if (next[key]) delete next[key];
    else next[key] = true;
    onDisabledItemsChange(next);
  };
  const data = parseData(jsonData);
  const characters = data.characters || [];
  const [tab, setTab] = useState<"cast" | "insights">("cast");

  const [localPortraits, setLocalPortraits] = useState<Record<string, PortraitState>>({});
  const [generatingAll, setGeneratingAll] = useState(false);
  const [genAllProgress, setGenAllProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const insights = useMemo(() => computeInsights(data), [data]);

  const mergedPortraits: Record<string, PortraitState> = useMemo(() => {
    const merged: Record<string, PortraitState> = {};
    for (const [k, v] of Object.entries(portraits)) {
      merged[k] = { status: "done", url: v.url };
    }
    for (const [k, v] of Object.entries(localPortraits)) {
      merged[k] = v;
    }
    return merged;
  }, [portraits, localPortraits]);

  const missingCount = characters.filter((c) => !portraits[c.name]).length;

  // Fetches one portrait and returns the result — the caller is responsible
  // for merging it into whatever "accumulated saved state" it's threading
  // through a batch. This avoids the stale-closure bug when multiple calls
  // happen sequentially: each call's spread of `portraits` would otherwise
  // wipe previous calls' work.
  const fetchPortrait = async (char: CharacterData): Promise<{ url: string } | null> => {
    const key = char.name;
    setLocalPortraits((prev) => ({ ...prev, [key]: { status: "generating" } }));
    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: char.name,
          description: char.description,
          stylePrefix: getStylePrefix("portrait"),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      setLocalPortraits((prev) => ({ ...prev, [key]: { status: "done", url } }));
      return { url };
    } catch {
      setLocalPortraits((prev) => ({ ...prev, [key]: { status: "error" } }));
      return null;
    }
  };

  const generateSingle = async (char: CharacterData) => {
    const result = await fetchPortrait(char);
    if (result) {
      onPortraitsChange({ ...portraits, [char.name]: { status: "done", url: result.url } });
    }
  };

  const generateAllPortraits = async () => {
    const toGenerate = characters.filter((c) => !portraits[c.name]);
    if (toGenerate.length === 0) return;

    cancelRef.current = false;
    setGeneratingAll(true);
    setGenAllProgress({ done: 0, total: toGenerate.length });

    // Thread a local accumulator so each onPortraitsChange call contains the
    // complete state including all previously generated portraits in this run.
    let accumulated: Record<string, SavedImage> = { ...portraits };

    for (let i = 0; i < toGenerate.length; i++) {
      if (cancelRef.current) break;
      const char = toGenerate[i];
      const result = await fetchPortrait(char);
      if (result) {
        accumulated = { ...accumulated, [char.name]: { status: "done", url: result.url } };
        onPortraitsChange(accumulated);
      }
      setGenAllProgress({ done: i + 1, total: toGenerate.length });
    }

    setGeneratingAll(false);
  };

  const cancelBulkGeneration = () => {
    cancelRef.current = true;
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <SectionLabelPill icon={<Users size={10} />} className="mb-3">
          People
        </SectionLabelPill>
        <h1 className="text-[32px] font-light tracking-[-0.025em] leading-[1.05] mb-2 text-foreground">
          Cast & Crew
        </h1>
        <p className="text-[13px] text-foreground/60 tracking-tight max-w-[60ch]">
          Characters in the film and situational insights — the specialty hires a line producer would flag on a first read.
        </p>
      </div>

      <div className="flex items-center gap-0 border-b border-border/60 mb-6">
        <button
          onClick={() => setTab("cast")}
          className={`relative px-3 py-3 text-[12px] font-medium tracking-tight transition-colors ${
            tab === "cast"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Cast ({characters.length})
          {tab === "cast" && (
            <span className="absolute -bottom-px left-2 right-2 h-px bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setTab("insights")}
          className={`relative px-3 py-3 text-[12px] font-medium tracking-tight transition-colors ${
            tab === "insights"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Insights ({insights.length})
          {tab === "insights" && (
            <span className="absolute -bottom-px left-2 right-2 h-px bg-foreground" />
          )}
        </button>

        {tab === "cast" && characters.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            {generatingAll ? (
              <>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {genAllProgress.done}/{genAllProgress.total}
                </span>
                <button
                  onClick={cancelBulkGeneration}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-foreground/20 transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </>
            ) : (
              missingCount > 0 && (
                <button
                  onClick={generateAllPortraits}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-foreground/20 transition-colors"
                >
                  <Images size={14} />
                  Generate {missingCount === characters.length ? "all" : `${missingCount} missing`} portraits
                </button>
              )
            )}
          </div>
        )}
      </div>

      {tab === "cast" && (
        <div className="space-y-3">
          {characters.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No characters in the screenplay JSON.
            </p>
          ) : (
            characters.map((char) => {
              const portrait = mergedPortraits[char.name];
              const disKey = `cast:${char.name}`;
              const isDisabled = !!disabledItems[disKey];
              return (
                <div
                  key={char.name}
                  className={`rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover p-5 flex gap-5 relative group/card transition-all ${
                    isDisabled ? "opacity-40" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleDisabled(disKey)}
                    className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    title={isDisabled ? "Re-enable this character" : "Disable this character"}
                  >
                    {isDisabled ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <div className="w-24 h-24 rounded-md shrink-0 bg-muted/40 border border-border/60 overflow-hidden flex items-center justify-center relative group">
                    {portrait?.status === "done" && portrait.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={portrait.url}
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                    ) : portrait?.status === "generating" ? (
                      <Loader2 size={20} className="text-muted-foreground animate-spin" />
                    ) : portrait?.status === "error" ? (
                      <button
                        onClick={() => generateSingle(char)}
                        className="flex flex-col items-center justify-center gap-1 text-[10px] text-destructive/80 hover:text-destructive"
                      >
                        <RefreshCw size={14} />
                        Retry
                      </button>
                    ) : (
                      <button
                        onClick={() => generateSingle(char)}
                        disabled={generatingAll}
                        className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground/70 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Generate portrait"
                      >
                        <Camera size={16} />
                        Portrait
                      </button>
                    )}

                    {/* Regenerate on hover when already done */}
                    {portrait?.status === "done" && !generatingAll && (
                      <button
                        onClick={() => generateSingle(char)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Regenerate portrait"
                      >
                        <RefreshCw size={16} className="text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[14px] font-semibold text-foreground uppercase tracking-[0.04em]">
                      {char.name}
                    </h2>
                    <p className="text-[13px] text-foreground/80 mt-1.5 leading-[1.55]">
                      {char.description}
                    </p>
                    {char.arc_summary && (
                      <p className="text-[12px] text-muted-foreground/90 italic mt-2 leading-[1.55]">
                        {char.arc_summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <span className="tabular-nums">
                        {char.scenes_present?.length || 0} scenes
                      </span>
                      {char.wardrobe_changes !== undefined && char.wardrobe_changes > 0 && (
                        <>
                          <span className="opacity-50">·</span>
                          <span className="tabular-nums">{char.wardrobe_changes} wardrobe changes</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "insights" && (
        <div>
          <p className="text-[12px] text-muted-foreground mb-4 max-w-[60ch]">
            Baseline roles — director, DP, producer, production designer — are assumed. This is the non-obvious stuff: the specialty hires a line producer would flag on a first read of the script.
          </p>
          {insights.length === 0 ? (
            <div className="rounded-[12px] bg-card/40 shadow-paper px-5 py-8 text-center">
              <Lightbulb size={18} className="mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-[13px] text-muted-foreground max-w-[48ch] mx-auto leading-[1.6]">
                No specialty situations detected. Your standard above-the-line team should carry this film without extra hires.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map((i) => {
                const disKey = `insight:${i.key}`;
                const isDisabled = !!disabledItems[disKey];
                return (
                  <div
                    key={i.key}
                    className={`rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover px-5 py-4 flex items-start gap-4 relative group/card transition-all ${
                      isDisabled ? "opacity-40" : ""
                    }`}
                  >
                    <div className="shrink-0 mt-0.5 w-7 h-7 rounded-[6px] bg-muted/60 flex items-center justify-center text-muted-foreground">
                      <Lightbulb size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap mb-1">
                        <h3 className="text-[14px] font-medium text-foreground tracking-tight">{i.title}</h3>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {i.signal}
                        </span>
                      </div>
                      <p className="text-[13px] text-foreground/75 leading-[1.6]">{i.recommendation}</p>
                    </div>
                    <button
                      onClick={() => toggleDisabled(disKey)}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 opacity-0 group-hover/card:opacity-100 transition-opacity"
                      title={isDisabled ? "Re-enable this insight" : "Disable this insight"}
                    >
                      {isDisabled ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
