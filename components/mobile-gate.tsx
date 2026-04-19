"use client";

import { useEffect, useState } from "react";

const BREAKPOINT = "(max-width: 1023px)";

export function MobileGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "mobile" | "ok">("checking");

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT);
    const update = () => setState(mql.matches ? "mobile" : "ok");
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (state === "checking") return null;
  if (state === "ok") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[340px] text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-9 w-9 shrink-0 rounded-[8px] bg-white flex items-center justify-center shadow-pill text-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Greenlight" className="w-[70%] h-[70%]" />
          </div>
          <span className="text-[17px] font-medium tracking-[-0.02em]">Greenlight</span>
        </div>
        <h1 className="text-[22px] font-medium tracking-[-0.02em] mb-3">
          Desktop only
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          Greenlight is a production tool built for a larger canvas. Open it on
          a desktop or laptop to continue.
        </p>
      </div>
    </div>
  );
}
