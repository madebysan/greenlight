import { ImageResponse } from "next/og";
import { DemoOgImage } from "@/lib/demo-og-image";

export async function GET(request: Request) {
  const posterPath = new URL(
    "/demo-images/dune-part-one/poster-1.jpg",
    request.url,
  ).toString();

  return new ImageResponse(
    (
      <DemoOgImage
        title="Dune: Part One"
        descriptor="A role-based visual deck for scale, desert geography, combat, production design, and key art."
        posterPath={posterPath}
        accent="#d19945"
        sceneCount="19"
        departmentCount="8"
      />
    ),
    { width: 1200, height: 630 },
  );
}
