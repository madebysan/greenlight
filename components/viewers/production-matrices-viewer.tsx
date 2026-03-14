"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Users, MapPin, Wrench, Shirt, Zap, FileText, ChevronDown, type LucideIcon } from "lucide-react";

type Character = {
  name: string;
  description: string;
  scenes: string;
  screenTime: string;
  specialReqs: string;
  wardrobeChanges: string;
};

type TableSection = {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
};

type TextSection = {
  id: string;
  title: string;
  content: string;
};

function parseProductionMatrices(md: string) {
  const lines = md.split("\n");
  let title = "";
  const characters: Character[] = [];
  const tableSections: TableSection[] = [];
  const textSections: TextSection[] = [];

  let currentSection = "";
  let currentSectionId = "";
  let currentHeaders: string[] = [];
  let currentRows: string[][] = [];
  let textBuffer = "";
  let textSectionTitle = "";
  let textSectionId = "";
  let inTextSection = false;

  const flushTable = () => {
    if (currentHeaders.length > 0 && currentRows.length > 0) {
      tableSections.push({
        id: currentSectionId,
        title: currentSection,
        headers: currentHeaders,
        rows: currentRows,
      });
    }
    currentHeaders = [];
    currentRows = [];
  };

  const flushText = () => {
    if (textBuffer.trim() && textSectionTitle) {
      textSections.push({ id: textSectionId, title: textSectionTitle, content: textBuffer.trim() });
    }
    textBuffer = "";
  };

  for (const line of lines) {
    if (/^# /.test(line) && !title) {
      title = line.replace(/^# (Production Matrices:\s*)?/, "").trim();
      continue;
    }

    const sectionMatch = line.match(/^## (?:\d+\.\s*)?(.+)/);
    if (sectionMatch) {
      flushTable();
      if (inTextSection) flushText();

      currentSection = sectionMatch[1].trim();
      currentSectionId = currentSection.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      inTextSection = currentSection.toLowerCase().includes("cross-reference") || currentSection.toLowerCase().includes("notes");
      if (inTextSection) {
        textSectionTitle = currentSection;
        textSectionId = currentSectionId;
      }
      continue;
    }

    if (inTextSection) {
      textBuffer += line + "\n";
      continue;
    }

    if (line.startsWith("|") && !line.match(/^\|[\s-|]+\|$/)) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (currentHeaders.length === 0) {
        currentHeaders = cells;
      } else {
        currentRows.push(cells);
      }
    }
  }

  flushTable();
  if (inTextSection) flushText();

  const charTable = tableSections.find((t) => t.title.toLowerCase().includes("character"));
  if (charTable) {
    for (const row of charTable.rows) {
      characters.push({
        name: row[0] || "",
        description: row[1] || "",
        scenes: row[2] || "",
        screenTime: row[3] || "",
        specialReqs: row[4] || "",
        wardrobeChanges: row[5] || "",
      });
    }
  }

  const otherTables = tableSections.filter((t) => !t.title.toLowerCase().includes("character"));

  return { title, characters, otherTables, textSections };
}

// --- Table type detection ---
function getTableType(title: string): "location" | "props" | "wardrobe" | "vfx" | "generic" {
  const lower = title.toLowerCase();
  if (lower.includes("location")) return "location";
  if (lower.includes("props")) return "props";
  if (lower.includes("wardrobe")) return "wardrobe";
  if (lower.includes("vfx") || lower.includes("stunt")) return "vfx";
  return "generic";
}

// --- Section-specific renderers ---

function LocationCards({ table }: { table: TableSection }) {
  return (
    <div className="space-y-3">
      {table.rows.map((row, i) => {
        const locName = (row[0] || "").replace(/_/g, " ");
        const locType = (row[1] || "").toUpperCase();
        const scenes = row[2] || "";
        const timeOfDay = row[3] || "";
        const setReqs = row[4] || "";
        const schedGroup = row[5] || "";
        const isExt = locType === "EXT";

        return (
          <div key={i} className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                isExt ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {locType}
              </span>
              <span className="text-sm font-semibold capitalize">{locName}</span>
              {schedGroup && (
                <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5 whitespace-nowrap">
                  {schedGroup}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {scenes.split(",").filter(Boolean).map((s, j) => (
                <span key={j} className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5">
                  Sc {s.trim()}
                </span>
              ))}
            </div>
            {timeOfDay && (
              <div className="text-[11px] text-muted-foreground mb-1.5">
                <span className="font-medium text-foreground/60">Time:</span> {timeOfDay}
              </div>
            )}
            {setReqs && (
              <p className="text-[12px] text-foreground/60 leading-relaxed">{setReqs}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PropsCards({ table }: { table: TableSection }) {
  const heroIdx = table.headers.findIndex((h) => h.toLowerCase().includes("hero"));
  const heroRows = heroIdx >= 0 ? table.rows.filter((r) => r[heroIdx]?.toLowerCase() === "yes") : [];
  const otherRows = heroIdx >= 0 ? table.rows.filter((r) => r[heroIdx]?.toLowerCase() !== "yes") : table.rows;

  const renderProp = (row: string[], isHero: boolean) => {
    const name = row[0] || "";
    const scenes = row[1] || "";
    const notes = row[3] || "";
    const dept = row[4] || "";

    return (
      <div key={`${name}-${scenes}`} className={`rounded-xl border p-4 ${isHero ? "border-primary/30 bg-primary/5" : ""}`}>
        <div className="flex items-start gap-2 mb-1.5">
          {isHero && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary text-primary-foreground shrink-0 mt-0.5">
              HERO
            </span>
          )}
          <span className="text-sm font-semibold flex-1">{name}</span>
          {dept && (
            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5 shrink-0">
              {dept}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {scenes.split(",").filter(Boolean).map((s, j) => (
            <span key={j} className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5">
              Sc {s.trim()}
            </span>
          ))}
        </div>
        {notes && <p className="text-[12px] text-foreground/60 leading-relaxed">{notes}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {heroRows.length > 0 && (
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hero Props</div>
          {heroRows.map((r) => renderProp(r, true))}
          {otherRows.length > 0 && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-1">Other Props</div>
          )}
        </>
      )}
      {otherRows.map((r) => renderProp(r, false))}
    </div>
  );
}

function WardrobeTimeline({ table }: { table: TableSection }) {
  const characters = [...new Set(table.rows.map((r) => r[0]))];

  return (
    <div className="space-y-6">
      {characters.map((char) => {
        const entries = table.rows.filter((r) => r[0] === char);
        return (
          <div key={char}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5 text-xs font-bold shrink-0">
                {char.charAt(0)}
              </div>
              <span className="text-sm font-semibold">{char}</span>
              <span className="text-[11px] text-muted-foreground">{entries.length} looks</span>
            </div>
            <div className="ml-9 space-y-1.5">
              {entries.map((row, i) => {
                const scene = row[1] || "";
                const desc = row[2] || "";
                const change = row[3] || "";
                const notes = row[4] || "";

                return (
                  <div key={i} className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
                    <span className="text-[11px] font-mono font-semibold bg-muted rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                      {scene}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-foreground/80">{desc}</span>
                      {change && change !== "Same" && change !== "Initial" && (
                        <span className={`ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded ${
                          change.toLowerCase() === "change"
                            ? "bg-blue-50 text-blue-600"
                            : change.toLowerCase() === "callback"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {change}
                        </span>
                      )}
                    </div>
                    {notes && <span className="text-[11px] text-muted-foreground italic shrink-0 max-w-[120px] text-right">{notes}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VFXCards({ table }: { table: TableSection }) {
  return (
    <div className="space-y-3">
      {table.rows.map((row, i) => {
        const scene = row[0] || "";
        const type = row[1] || "";
        const desc = row[2] || "";
        const complexity = row[3] || "";
        const reqs = row[4] || "";

        const complexityColor = complexity.toLowerCase().includes("high")
          ? "bg-red-50 text-red-700 border-red-200"
          : complexity.toLowerCase().includes("moderate")
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-green-50 text-green-700 border-green-200";

        return (
          <div key={i} className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-semibold bg-muted rounded px-1.5 py-0.5">
                Sc {scene}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-200">
                {type}
              </span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${complexityColor}`}>
                {complexity}
              </span>
            </div>
            <p className="text-[13px] text-foreground/80 mb-1">{desc}</p>
            {reqs && <p className="text-[12px] text-foreground/60 leading-relaxed">{reqs}</p>}
          </div>
        );
      })}
    </div>
  );
}

function GenericTable({ table }: { table: TableSection }) {
  return (
    <div className="overflow-x-auto rounded-lg border shadow-xs">
      <table className="w-full text-[13px] border-collapse">
        <thead className="bg-muted/50 sticky top-0">
          <tr>
            {table.headers.map((h, i) => (
              <th
                key={i}
                className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b whitespace-nowrap ${
                  i === 0 ? "sticky left-0 bg-muted/50 z-10" : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {table.rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-muted/30 transition-colors">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2.5 text-[13px] align-top ${
                    ci === 0
                      ? "font-medium text-foreground sticky left-0 bg-background z-10 whitespace-nowrap"
                      : "text-foreground/70"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Render table by type ---
function renderTableSection(table: TableSection) {
  const tableType = getTableType(table.title);
  switch (tableType) {
    case "location": return <LocationCards table={table} />;
    case "props": return <PropsCards table={table} />;
    case "wardrobe": return <WardrobeTimeline table={table} />;
    case "vfx": return <VFXCards table={table} />;
    default: return <GenericTable table={table} />;
  }
}

// --- Section nav config ---
const SECTION_NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "characters", label: "Characters", icon: Users },
  { id: "location", label: "Locations", icon: MapPin },
  { id: "props", label: "Props", icon: Wrench },
  { id: "wardrobe", label: "Wardrobe", icon: Shirt },
  { id: "vfx", label: "VFX/Stunts", icon: Zap },
  { id: "cross-reference", label: "Notes", icon: FileText },
];

// --- Collapsible section wrapper ---
function CollapsibleSection({
  id,
  title,
  count,
  countLabel,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  countLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 py-3 group cursor-pointer"
      >
        <ChevronDown
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
        />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <div className="flex-1 h-px bg-border" />
        {count !== undefined && (
          <span className="text-[11px] text-muted-foreground shrink-0">
            {count} {countLabel || "items"}
          </span>
        )}
      </button>
      {open && <div className="pt-1">{children}</div>}
    </section>
  );
}

// --- Map table titles to nav IDs ---
function getNavId(tableTitle: string) {
  const type = getTableType(tableTitle);
  return type === "generic" ? tableTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") : type;
}

// --- Main component ---
export function ProductionMatricesViewer({ content }: { content: string }) {
  const { characters, otherTables, textSections } = useMemo(
    () => parseProductionMatrices(content),
    [content]
  );
  const [activeSection, setActiveSection] = useState("characters");
  const containerRef = useRef<HTMLDivElement>(null);

  // Build list of all section IDs in order for scroll tracking
  const sectionIds = useMemo(() => {
    const ids = ["characters"];
    for (const table of otherTables) {
      ids.push(getNavId(table.title));
    }
    if (textSections.length > 0) ids.push("cross-reference");
    return ids;
  }, [otherTables, textSections]);

  // Track which section is visible while scrolling (throttled to one check per frame)
  const rafRef = useRef(0);
  const scrollContainerRef = useRef<Element | null>(null);
  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const containerTop = scrollContainer.getBoundingClientRect().top;
      let closest = sectionIds[0];
      let closestDistance = Infinity;

      for (const id of sectionIds) {
        const el = document.getElementById(`pm-${id}`);
        if (!el) continue;
        const distance = Math.abs(el.getBoundingClientRect().top - containerTop - 80);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = id;
        }
      }

      setActiveSection(closest);
    });
  }, [sectionIds]);

  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto");
    if (!scrollContainer) return;
    scrollContainerRef.current = scrollContainer;
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
      scrollContainerRef.current = null;
    };
  }, [handleScroll]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`pm-${id}`);
    if (!el) return;
    const scrollContainer = el.closest(".overflow-y-auto");
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollOffset = elRect.top - containerRect.top + scrollContainer.scrollTop - 60;
      scrollContainer.scrollTo({ top: scrollOffset, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div ref={containerRef}>
      {/* Section navigation pills — sticky within scroll container */}
      <div className="flex flex-wrap gap-1.5 mb-6 sticky top-0 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1 z-20 border-b border-transparent [.overflow-y-auto_&]:border-border/40">
        {SECTION_NAV.map((nav) => {
          const Icon = nav.icon;
          return (
            <button
              key={nav.id}
              onClick={() => scrollToSection(nav.id)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeSection === nav.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <Icon size={13} />
              {nav.label}
            </button>
          );
        })}
      </div>

      {/* Characters */}
      <CollapsibleSection
        id="pm-characters"
        title="Character Matrix"
        count={characters.length}
        countLabel={characters.length === 1 ? "character" : "characters"}
      >
        <div className="space-y-3">
          {characters.map((char) => {
            const sceneCount = char.scenes.split(",").filter(Boolean).length;
            return (
              <div key={char.name} className="rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-sm font-bold shrink-0">
                    {char.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{char.name}</span>
                      <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {sceneCount} {sceneCount === 1 ? "scene" : "scenes"}
                      </span>
                      <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {char.screenTime}
                      </span>
                      {char.wardrobeChanges && char.wardrobeChanges !== "0" && (
                        <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                          {char.wardrobeChanges} {char.wardrobeChanges === "1" ? "wardrobe change" : "wardrobe changes"}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-foreground/70 leading-relaxed mb-2">
                      {char.description}
                    </p>
                    {char.specialReqs && char.specialReqs !== "None" && (
                      <div className="flex gap-2 items-start">
                        <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold bg-amber-50 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                          Special
                        </span>
                        <span className="text-[12px] text-foreground/60">
                          {char.specialReqs}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Other sections with type-specific rendering */}
      {otherTables.map((table) => {
        const navId = getNavId(table.title);
        return (
          <CollapsibleSection
            key={table.id}
            id={`pm-${navId}`}
            title={table.title}
            count={table.rows.length}
          >
            {renderTableSection(table)}
          </CollapsibleSection>
        );
      })}

      {/* Text sections (Cross-Reference Notes) */}
      {textSections.map((section) => (
        <CollapsibleSection
          key={section.id}
          id="pm-cross-reference"
          title={section.title}
        >
          <div className="rounded-xl border p-5 text-[13px] leading-[1.7] text-foreground/75 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground [&_strong]:font-semibold [&_p]:mb-3 [&_p]:max-w-[72ch] [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:mb-4 [&_li]:mb-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.content}
            </ReactMarkdown>
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
}
