import { ImageResponse } from "next/og";
import { DemoOgImage } from "@/lib/demo-og-image";

export async function GET(request: Request) {
  const posterPath = new URL(
    "/demo-images/the-favourite/poster-1.jpg",
    request.url,
  ).toString();

  return new ImageResponse(
    (
      <DemoOgImage
        title="The Favourite"
        descriptor="A role-based visual deck for court intrigue, period interiors, ensemble cast, production design, and key art."
        posterPath={posterPath}
        accent="#c0a062"
        sceneCount="44"
        departmentCount="8"
      />
    ),
    { width: 1200, height: 630 },
  );
}
