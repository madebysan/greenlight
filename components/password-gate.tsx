"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "greenlight-access";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "gate" | "authorized">("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    // Already authenticated this session
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setState("authorized");
      return;
    }
    // Check if gate is enabled (ACCESS_PASSWORD is set on server)
    fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "" }),
    }).then((res) => {
      if (res.ok) {
        // No password configured — skip gate
        sessionStorage.setItem(STORAGE_KEY, "1");
        setState("authorized");
      } else {
        setState("gate");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setState("authorized");
    } else {
      setError(true);
      setPassword("");
      setTimeout(() => setError(false), 1500);
    }
  };

  if (state === "checking") return null;
  if (state === "authorized") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[280px] space-y-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 shrink-0 rounded-[8px] bg-white flex items-center justify-center shadow-pill text-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Greenlight" className="w-[70%] h-[70%]" />
          </div>
          <span className="text-[17px] font-medium tracking-[-0.02em]">Greenlight</span>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className={`w-full rounded-lg border bg-card/40 px-4 py-3 text-sm tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
            error ? "border-destructive/60" : "border-border"
          }`}
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-white text-black py-3 text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
