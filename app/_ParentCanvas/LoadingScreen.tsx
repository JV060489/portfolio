"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// ── Assets to preload ───────────────────────────────────────────────────────
const FONT_URLS = [
  "/fonts/Aldrich-Regular.ttf",
  "/fonts/Lexend-Black.ttf",
  "/fonts/Roboto_Condensed-Black.ttf",
];

const MODEL_URLS = ["/LightsModel.glb"];

const FONT_FACES = [
  '400 40px "Pixelify Sans"',
  '400 16px "Aldrich"',
];

const ALL_ASSETS = [...FONT_URLS, ...MODEL_URLS, ...FONT_FACES];
const TOTAL = ALL_ASSETS.length;

// Toggle to false for production — when true, fakes a slow load to preview the animation
const DEBUG_SLOW_LOAD = false;
const DEBUG_LOAD_DURATION = 3000; // ms

// ── Flip Digit ──────────────────────────────────────────────────────────────

interface FlipDigitProps {
  digit: string;
}

function FlipDigit({ digit }: FlipDigitProps) {
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLDivElement>(null);
  const prevDigitRef = useRef<string>(digit);
  const [displayOld, setDisplayOld] = useState(digit);
  const [displayNew, setDisplayNew] = useState(digit);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (digit === prevDigitRef.current) return;

    // Kill any running animation immediately
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    setDisplayOld(prevDigitRef.current);
    setDisplayNew(digit);
    prevDigitRef.current = digit;

    const outEl = outRef.current;
    const inEl = inRef.current;
    if (!outEl || !inEl) return;

    const tl = gsap.timeline();
    tlRef.current = tl;

    // Reset positions
    gsap.set(outEl, { yPercent: 0, opacity: 1 });
    gsap.set(inEl, { yPercent: 100, opacity: 0 });

    // Old digit slides up and out
    tl.to(outEl, {
      yPercent: -100,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
    });

    // New digit slides up into place
    tl.to(
      inEl,
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.25,
        ease: "power2.out",
      },
      0.05,
    );

    return () => {
      tl.kill();
    };
  }, [digit]);

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: "0.65em", height: "1.1em" }}
    >
      {/* Outgoing digit */}
      <div
        ref={outRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        {displayOld}
      </div>
      {/* Incoming digit */}
      <div
        ref={inRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        {displayNew}
      </div>
    </div>
  );
}

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
    let assetsReady = false;
    let timerReady = !DEBUG_SLOW_LOAD;

    const finish = () => {
      if (cancelled || !assetsReady || !timerReady) return;
      setProgress(99);
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
        delay: 0.3,
        onComplete: () => onCompleteRef.current(),
      });
    };

    // Debug: animate progress from 0–99 over DEBUG_LOAD_DURATION
    let rafId: number | undefined;
    if (DEBUG_SLOW_LOAD) {
      const start = performance.now();
      const step = (now: number) => {
        if (cancelled) return;
        const elapsed = now - start;
        const pct = Math.min(Math.round((elapsed / DEBUG_LOAD_DURATION) * 99), 99);
        setProgress(pct);
        if (pct < 99) {
          rafId = requestAnimationFrame(step);
        } else {
          timerReady = true;
          finish();
        }
      };
      rafId = requestAnimationFrame(step);
    }

    const tick = () => {
      if (cancelled) return;
      loaded++;
      if (!DEBUG_SLOW_LOAD) {
        const pct = Math.round((loaded / TOTAL) * 100);
        progressRef.current = pct;
        setProgress(Math.min(pct, 99));
      }
      if (loaded >= TOTAL) {
        assetsReady = true;
        finish();
      }
    };

    for (const url of [...FONT_URLS, ...MODEL_URLS]) {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          return res.arrayBuffer();
        })
        .then(() => tick())
        .catch(() => tick());
    }

    for (const fontSpec of FONT_FACES) {
      document.fonts
        .load(fontSpec)
        .then(() => tick())
        .catch(() => tick());
    }

    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  // Format progress as two digits (00–99, clamped)
  const display = String(Math.min(progress, 99)).padStart(2, "0");
  const tens = display[0];
  const ones = display[1];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-9999 flex items-end justify-end"
      style={{ background: "var(--bg, #000000)" }}
    >
      <div
        className="flex select-none pr-6 pb-6 sm:pr-10 sm:pb-10 lg:pr-16 lg:pb-12"
        style={{
          color: "var(--fg, #ffffff)",
          fontFamily: "var(--font-aldrich), monospace",
          fontSize: "clamp(8rem, 20vw, 16rem)",
          lineHeight: 1,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          opacity: 0.9,
        }}
      >
        <FlipDigit digit={tens} />
        <FlipDigit digit={ones} />
      </div>
    </div>
  );
}
