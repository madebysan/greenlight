import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Space_Mono } from "next/font/google";
import { Agentation } from "agentation";
import { PasswordGate } from "@/components/password-gate";
import { MobileGate } from "@/components/mobile-gate";
import { ApiKeysProvider } from "@/lib/api-keys-context";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "400",
  display: "swap",
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
  description: "Turn a screenplay into a film deck.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Greenlight",
    description: "Turn a screenplay into a film deck.",
    type: "website",
    url: "/",
    siteName: "Greenlight",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Greenlight",
    description: "Turn a screenplay into a film deck.",
    images: ["/og-image.png"],
  },
};

// Greenlight is dark-only in the Cinemateca sister-product direction.
const themeInitScript = `
(function() {
  try {
    localStorage.removeItem('greenlight-theme');
    document.documentElement.classList.add('dark');
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
        className={`${dmSans.variable} ${instrumentSerif.variable} ${spaceMono.variable} antialiased`}
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
