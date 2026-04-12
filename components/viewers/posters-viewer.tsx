"use client";

import { Frame } from "lucide-react";
import { PosterConceptsViewer } from "@/components/viewers/poster-concepts-viewer";
import { SectionLabelPill } from "@/components/ui/inline-chip";
import type { SavedImage } from "@/lib/reports";

type PostersViewerProps = {
  posterContent: string | null;
  posterImages: Record<number, SavedImage>;
  onPosterImagesChange: (images: Record<number, SavedImage>) => void;
};

export function PostersViewer({
  posterContent,
  posterImages,
  onPosterImagesChange,
}: PostersViewerProps) {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <SectionLabelPill icon={<Frame size={10} />} className="mb-3">
          Key Art
        </SectionLabelPill>
        <h1 className="text-[32px] font-light tracking-[-0.025em] leading-[1.05] mb-2 text-foreground">
          Posters
        </h1>
        <p className="text-[13px] text-foreground/60 tracking-tight">
          Poster concepts across categories — character-driven, abstract,
          object-led. Each one a different angle on how the film presents
          itself to an audience.
        </p>
      </div>

      {posterContent ? (
        <PosterConceptsViewer
          content={posterContent}
          savedImages={posterImages}
          onImagesChange={onPosterImagesChange}
        />
      ) : (
        <p className="text-sm text-muted-foreground py-12 text-center tracking-tight">
          Poster concepts haven&apos;t been generated yet.
        </p>
      )}
    </div>
  );
}
