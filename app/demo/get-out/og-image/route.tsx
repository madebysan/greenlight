import { ImageResponse } from "next/og";
import { DemoOgImage } from "@/lib/demo-og-image";

export async function GET(request: Request) {
  const posterPath = new URL(
    "/demo-images/get-out/poster-1.jpg",
    request.url,
  ).toString();

  return new ImageResponse(
    (
      <DemoOgImage
        title="Get Out"
        descriptor="A role-based visual deck for atmosphere, production pressure, casting, locations, design, and key art."
        posterPath={posterPath}
        accent="#9c1b22"
        sceneCount="24"
        departmentCount="8"
      />
    ),
    { width: 1200, height: 630 },
  );
}
