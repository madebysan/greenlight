type InlineChipProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "accent" | "dark";
  className?: string;
};

/**
 * Inline pill chip for baking key nouns into prose.
 * Inline chip for baking key nouns into prose.
 *
 *   "Track, analyze, and improve brand performance through ◉ Visibility, ◇ Position, and ◡ Sentiment."
 *
 * - default: matches the page canvas, hairline inset ring
 * - accent: slightly brighter for emphasis
 * - dark: inverted (rare, used for highlight callouts)
 */
export function InlineChip({ icon, children, tone = "default", className = "" }: InlineChipProps) {
  const toneClasses = {
    default:
      "border border-border bg-white/[0.03] text-foreground/80",
    accent:
      "border border-border bg-white/[0.06] text-foreground",
    dark:
      "border border-border bg-background text-white",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-[3px] mx-0.5 rounded-full font-mono text-[11px] tabular-nums align-baseline whitespace-nowrap ${toneClasses} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * Small uppercase section label, matching Cinemateca's detail-page rhythm.
 */
export function SectionLabelPill({
  icon,
  children,
  className = "",
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground ${className}`}
    >
      {icon}
      {children}
    </div>
  );
}
