"use client";

import { useState, useRef, useMemo } from "react";
import { Loader2, Camera, RefreshCw, Images, X, EyeOff, Eye, Users } from "lucide-react";
import { SectionLabelPill } from "@/components/ui/inline-chip";
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
  scenes?: Array<{ vfx_stunts?: string[]; int_ext?: string; time_of_day?: string }>;
  locations?: unknown[];
  writer?: string;
};

function parseData(jsonData: string): ScreenplayData {
  try {
    return JSON.parse(jsonData) as ScreenplayData;
  } catch {
    return {};
  }
}

// Rough heuristic to suggest which crew roles the film's scope implies.
// Editable / not comprehensive — designed to start a conversation, not finish one.
function suggestCrewRoles(data: ScreenplayData): { role: string; note: string }[] {
  const scenes = data.scenes || [];
  const characters = data.characters || [];
  const locations = data.locations || [];

  const vfxScenes = scenes.filter((s) => Array.isArray(s.vfx_stunts) && s.vfx_stunts.length > 0).length;
  const nightScenes = scenes.filter((s) => s.time_of_day === "NIGHT").length;
  const exteriorScenes = scenes.filter((s) => s.int_ext === "EXT" || s.int_ext === "BOTH").length;

  // Stunt heuristic: check both scene vfx_stunts AND character special_requirements
  // for combat/fall/stunt keywords.
  const stuntPattern = /stunt|fight|fall|combat|squib|chase|gun/i;
  const stuntScenes = scenes.filter(
    (s) => Array.isArray(s.vfx_stunts) && s.vfx_stunts.some((v) => stuntPattern.test(v)),
  ).length;
  const stuntCharacters = characters.filter((c) =>
    (c.special_requirements || []).some((r) => stuntPattern.test(r)),
  ).length;

  const roles: { role: string; note: string }[] = [
    {
      role: "Writer",
      note: data.writer
        ? `${data.writer} — credited on the screenplay.`
        : "Original screenplay credit. Update with the writer name from the title page.",
    },
    { role: "Director", note: "Essential on every project." },
    { role: "Producer", note: "Essential on every project." },
    { role: "Director of Photography", note: "Essential on every project." },
    { role: "1st Assistant Director", note: "Scene count and coordination suggest you need one." },
    { role: "Production Designer", note: `${locations.length} unique locations and period-specific set dressing.` },
    { role: "Sound Mixer", note: "Dialogue-heavy scenes require proper on-set sound." },
    { role: "Script Supervisor", note: `${scenes.length} scenes — continuity is non-trivial.` },
  ];

  if (characters.length >= 4) {
    roles.push({
      role: "Casting Director",
      note: `${characters.length} principal characters — worth bringing in casting help.`,
    });
  }

  if (stuntScenes > 0 || stuntCharacters > 0) {
    const bits = [];
    if (stuntScenes > 0) bits.push(`${stuntScenes} scenes with stunt work`);
    if (stuntCharacters > 0) bits.push(`${stuntCharacters} cast with stunt requirements`);
    roles.push({
      role: "Stunt Coordinator",
      note: `${bits.join(", ")} — safety and choreography non-negotiable.`,
    });
  }

  if (vfxScenes > 0) {
    roles.push({
      role: "VFX / Practical Effects Supervisor",
      note: `${vfxScenes} scenes have practical or visual effects needs.`,
    });
  }

  if (nightScenes >= 3) {
    roles.push({
      role: "Gaffer + Lighting Crew",
      note: `${nightScenes} night scenes — lighting package and crew needed.`,
    });
  }

  if (exteriorScenes >= 3) {
    roles.push({
      role: "Location Scout / Manager",
      note: `${exteriorScenes} exterior scenes — permits, parking, weather contingency.`,
    });
  }

  return roles;
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
  const [tab, setTab] = useState<"cast" | "crew">("cast");

  const [localPortraits, setLocalPortraits] = useState<Record<string, PortraitState>>({});
  const [generatingAll, setGeneratingAll] = useState(false);
  const [genAllProgress, setGenAllProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const crewRoles = suggestCrewRoles(data);

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
        body: JSON.stringify({ name: char.name, description: char.description }),
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
          Characters in the film and a scope-based read on the crew roles you&apos;ll need.
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
          onClick={() => setTab("crew")}
          className={`relative px-3 py-3 text-[12px] font-medium tracking-tight transition-colors ${
            tab === "crew"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Crew ({crewRoles.length})
          {tab === "crew" && (
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

      {tab === "crew" && (
        <div>
          <p className="text-[12px] text-muted-foreground mb-4 max-w-[60ch]">
            These are the roles the film&apos;s scope implies. It&apos;s a starting point for a conversation with a line producer, not a final crew list.
          </p>
          <div className="space-y-2">
            {crewRoles.map((r) => {
              const disKey = `crew:${r.role}`;
              const isDisabled = !!disabledItems[disKey];
              return (
                <div
                  key={r.role}
                  className={`rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover px-4 py-3 flex items-start gap-3 relative group/card transition-all ${
                    isDisabled ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-foreground uppercase tracking-[0.04em]">{r.role}</div>
                    <div className="text-[12px] text-muted-foreground mt-1 leading-[1.55]">
                      {r.note}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDisabled(disKey)}
                    className="shrink-0 p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    title={isDisabled ? "Re-enable this role" : "Disable this role"}
                  >
                    {isDisabled ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
