type InlineChipProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "accent" | "dark";
  className?: string;
};

/**
 * Inline pill chip for baking key nouns into prose.
 * Peec.ai pattern: feature nouns sit inline with the subtitle text as pills,
 * not broken out into a separate feature list.
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
      "bg-white/[0.04] text-foreground/85 shadow-pill",
    accent:
      "bg-white/[0.08] text-foreground shadow-pill",
    dark:
      "bg-[#0C0A09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),_0_4px_12px_rgba(0,0,0,0.5)]",
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
 * Section-label pill — the floating eyebrow tag above section titles.
 * Small, neutral, icon-optional.
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground shadow-pill ${className}`}
    >
      {icon}
      {children}
    </div>
  );
}
