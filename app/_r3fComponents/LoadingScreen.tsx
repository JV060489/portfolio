"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// ── Assets to preload ───────────────────────────────────────────────────────
const FONT_URLS = [
  "/fonts/Aldrich-Regular.ttf",
  "/fonts/Lexend-Black.ttf",
  "/fonts/Roboto_Condensed-Black.ttf",
];

const MODEL_URLS = ["/AboutMe.glb"];

const FONT_FACES = [
  '400 40px "Pixelify Sans"',
  '400 16px "Aldrich"',
];

const ALL_ASSETS = [...FONT_URLS, ...MODEL_URLS, ...FONT_FACES];
const TOTAL = ALL_ASSETS.length;

// ── Component ────────────────────────────────────────────────────────────────

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let loaded = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      loaded++;
      const pct = Math.round((loaded / TOTAL) * 100);
      progressRef.current = pct;
      setProgress(pct);

      if (loaded >= TOTAL) {
        // Small delay so the user sees 100%, then animate out
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
          delay: 0.3,
          onComplete: () => onCompleteRef.current(),
        });
      }
    };

    // Preload binary assets (fonts + models) via fetch
    for (const url of [...FONT_URLS, ...MODEL_URLS]) {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          return res.arrayBuffer();
        })
        .then(() => tick())
        .catch(() => tick()); // count failures so we don't stall
    }

    // Preload CSS font faces (Google Fonts already loaded by Next.js, just ensure render-ready)
    for (const fontSpec of FONT_FACES) {
      document.fonts
        .load(fontSpec)
        .then(() => tick())
        .catch(() => tick());
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "var(--bg, #000000)" }}
    >
      {/* Percentage */}
      <span
        className="text-5xl font-light tracking-widest tabular-nums"
        style={{
          color: "var(--fg, #ffffff)",
          fontFamily: "var(--font-aldrich), monospace",
        }}
      >
        {progress}%
      </span>

      {/* Progress bar */}
      <div className="mt-6 h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white/60 transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Label */}
      <span
        className="mt-4 text-xs tracking-[0.3em] uppercase opacity-40"
        style={{
          color: "var(--fg, #ffffff)",
          fontFamily: "var(--font-aldrich), monospace",
        }}
      >
        Loading
      </span>
    </div>
  );
}