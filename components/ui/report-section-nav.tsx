"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

export type ReportSectionNavItem = {
  index: string;
  label: string;
  onClick: () => void;
};

export function ReportSectionNav({
  previous,
  next,
}: {
  previous?: ReportSectionNavItem;
  next?: ReportSectionNavItem;
}) {
  if (!previous && !next) return null;
  const hasBoth = Boolean(previous && next);

  return (
    <nav
      aria-label="Adjacent report sections"
      className="mt-14 border-t border-border/80 pt-5"
    >
      <div className={`grid gap-3 ${hasBoth ? "md:grid-cols-2" : ""}`}>
        {previous ? <SectionLink item={previous} direction="previous" /> : null}
        {next ? <SectionLink item={next} direction="next" /> : null}
      </div>
    </nav>
  );
}

function SectionLink({
  item,
  direction,
}: {
  item: ReportSectionNavItem;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  const Arrow = isNext ? ArrowRight : ArrowLeft;
  const icon = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-border bg-white/[0.04] text-muted-foreground transition-colors group-hover:text-foreground">
      <Arrow size={15} />
    </span>
  );
  const content = (
    <span className="min-w-0">
      <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {isNext ? "After" : "Before"} / {item.index}
      </span>
      <span className="mt-2 block truncate text-[16px] font-semibold leading-tight tracking-normal text-foreground">
        {item.label}
      </span>
    </span>
  );

  return (
    <button
      type="button"
      onClick={item.onClick}
      className="group flex min-h-[96px] w-full items-center justify-between gap-5 rounded-[12px] border border-border bg-card/35 p-4 text-left shadow-paper transition-colors hover:border-foreground/18 hover:bg-card/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
    >
      {!isNext && icon}
      {content}
      {isNext && icon}
    </button>
  );
}
