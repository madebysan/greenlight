import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { Agentation } from "agentation";
import { PasswordGate } from "@/components/password-gate";
import { MobileGate } from "@/components/mobile-gate";
import { ApiKeysProvider } from "@/lib/api-keys-context";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Greenlight",
    // Per-page titles become "Title — Greenlight" automatically.
    template: "%s — Greenlight",
  },
  description: "Turn a script into something tangible, fast. A vision deck generator for indie filmmakers.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Greenlight",
    description: "Turn a script into something tangible, fast. A vision deck generator for indie filmmakers.",
    type: "website",
    url: "/",
    siteName: "Greenlight",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Greenlight",
    description: "Turn a script into something tangible, fast.",
    images: ["/og-image.png"],
  },
};

// Inline script reads theme from localStorage before first paint so we
// never flash the wrong theme on reload. Runs synchronously in <head>.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('greenlight-theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} antialiased`}
      >
        <MobileGate>
          <PasswordGate>
            <ApiKeysProvider>{children}</ApiKeysProvider>
          </PasswordGate>
        </MobileGate>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
