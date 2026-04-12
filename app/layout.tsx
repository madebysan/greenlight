import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { Agentation } from "agentation";
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
  title: "Greenlight",
  description: "Turn a script into something tangible, fast. A pre-production bible generator for indie filmmakers.",
  openGraph: {
    title: "Greenlight",
    description: "Turn a script into something tangible, fast. A pre-production bible generator for indie filmmakers.",
    type: "website",
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
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
