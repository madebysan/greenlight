import { WizardShell } from "@/components/wizard/wizard-shell";
import { getSiteUrl } from "@/lib/site-url";

export default function Home() {
  // Minimal JSON-LD so AI assistants and search engines can identify
  // Greenlight when someone asks "what's Greenlight". Lives inline in the
  // home page so it travels with the main entry URL.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Greenlight",
    description:
      "Turn a script into something tangible, fast. A vision deck generator for indie filmmakers.",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    url: getSiteUrl(),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Santiago Alonso",
      url: "https://santiagoalonso.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WizardShell />
    </>
  );
}
