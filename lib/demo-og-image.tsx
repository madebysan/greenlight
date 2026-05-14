type DemoOgImageProps = {
  title: string;
  descriptor: string;
  posterPath: string;
  accent: string;
  sceneCount: string;
  departmentCount: string;
};

export function DemoOgImage({
  title,
  descriptor,
  posterPath,
  accent,
  sceneCount,
  departmentCount,
}: DemoOgImageProps) {
  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "#f3f0e8",
        color: "#171615",
        fontFamily: "Georgia, serif",
        padding: "54px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "20px",
          border: "1px solid rgba(23, 22, 21, 0.16)",
          borderRadius: "28px",
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          gap: "48px",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            width: "360px",
            display: "flex",
            borderRadius: "22px",
            overflow: "hidden",
            border: "1px solid rgba(23, 22, 21, 0.18)",
            boxShadow: "0 28px 90px rgba(23, 22, 21, 0.22)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders raw image tags, not next/image. */}
          <img
            src={posterPath}
            alt=""
            style={{
              width: "360px",
              height: "522px",
              objectFit: "cover",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "10px 0 4px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                fontSize: "22px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(23, 22, 21, 0.56)",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: accent,
                }}
              />
              Greenlight Report
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "88px",
                  lineHeight: 0.9,
                  fontWeight: 500,
                  maxWidth: "670px",
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  margin: 0,
                  maxWidth: "650px",
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontSize: "28px",
                  lineHeight: 1.35,
                  color: "rgba(23, 22, 21, 0.64)",
                }}
              >
                {descriptor}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minWidth: "180px",
                borderTop: "1px solid rgba(23, 22, 21, 0.18)",
                paddingTop: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(23, 22, 21, 0.46)",
                }}
              >
                Scenes
              </span>
              <strong style={{ fontSize: "34px", fontWeight: 500 }}>
                {sceneCount}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minWidth: "250px",
                borderTop: "1px solid rgba(23, 22, 21, 0.18)",
                paddingTop: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(23, 22, 21, 0.46)",
                }}
              >
                Department Passes
              </span>
              <strong style={{ fontSize: "34px", fontWeight: 500 }}>
                {departmentCount}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
