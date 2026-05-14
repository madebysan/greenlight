import { ImageResponse } from "next/og";
import { DemoOgImage } from "@/lib/demo-og-image";

export async function GET(request: Request) {
  const posterPath = new URL(
    "/demo-images/red-balloon/poster-1.jpg",
    request.url,
  ).toString();

  return new ImageResponse(
    (
      <DemoOgImage
        title="The Red Balloon"
        descriptor="A compact visual deck for story tone, geography, casting, production design, and poster direction."
        posterPath={posterPath}
        accent="#dc143c"
        sceneCount="20"
        departmentCount="8"
      />
    ),
    { width: 1200, height: 630 },
  );
}
