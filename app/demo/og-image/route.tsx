import { ImageResponse } from "next/og";
import { DemoOgImage } from "@/lib/demo-og-image";

export async function GET(request: Request) {
  const posterPath = new URL(
    "/demo-images/poster-1067b02e-966.jpg",
    request.url,
  ).toString();

  return new ImageResponse(
    (
      <DemoOgImage
        title="Night of the Living Dead"
        descriptor="A role-based production read for mood, locations, casting, design, identity, and key art."
        posterPath={posterPath}
        accent="#a84f18"
        sceneCount="20"
        departmentCount="8"
      />
    ),
    { width: 1200, height: 630 },
  );
}
