import { ImageResponse } from "next/og";
import { DemoOgImage } from "@/lib/demo-og-image";

export async function GET(request: Request) {
  const posterPath = new URL(
    "/demo-images/past-lives/poster-1.jpg",
    request.url,
  ).toString();

  return new ImageResponse(
    (
      <DemoOgImage
        title="Past Lives"
        descriptor="A role-based visual deck for diasporic romance, intimate scenes, three-city geography, and key art."
        posterPath={posterPath}
        accent="#7a8fa6"
        sceneCount="16"
        departmentCount="8"
      />
    ),
    { width: 1200, height: 630 },
  );
}
