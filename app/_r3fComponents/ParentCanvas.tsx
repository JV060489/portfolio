"use client";

import { Canvas } from "@react-three/fiber";
import { useState, useRef, useEffect } from "react";
import IntroText from "./IntroText";
import PixelBurstReveal, { type PixelBurstHandle } from "./PixelBurst";
import DarkModeLamp from "./DarkModeLamp";
import ThemeTransitionOverlay, {
  type ThemeTransitionHandle,
} from "./_unused/ThemeTransitionOverlay";
import { useTheme } from "@/app/context/ThemeContext";
import { cn } from "@/utils/utils";

/**
 * Approximate Y-fraction of the bulb within the lamp Canvas div.
 * Derived from 3D geometry: group rests at posY=0.5, bulb offset=-0.3 → world Y=0.2
 * With camera at z=4, fov=40: NDC_Y ≈ 0.137, pixel_Y ≈ (1-0.137)/2 * height ≈ 43%
 */
const BULB_Y_FRACTION = 0.43;

function ParentCanvas() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [introComplete, setIntroComplete] = useState(false);
  const [lampVisible, setLampVisible] = useState(false);

  const burstRef = useRef<PixelBurstHandle>(null);
  const burstRef2 = useRef<PixelBurstHandle>(null);
  const transitionRef = useRef<ThemeTransitionHandle>(null);
  const lampDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!introComplete) return;
    const ids: ReturnType<typeof setTimeout>[] = [];
    ids.push(setTimeout(() => burstRef.current?.trigger(), 200));
    ids.push(setTimeout(() => burstRef2.current?.trigger(), 2200));
    // Lamp appears after "3D Web Developer" burst fully finishes (~4200ms)
    ids.push(setTimeout(() => setLampVisible(true), 4500));
    return () => ids.forEach(clearTimeout);
  }, [introComplete]);

  /**
   * Called when the user clicks the lamp bulb.
   * Calculates the bulb's screen position, then fires the full-screen radial
   * pixel burst: old mode → covered → new mode, with the theme switch at midpoint.
   */
  const handleLampToggle = () => {
    if (!transitionRef.current) {
      toggleTheme();
      return;
    }

    // Derive the bulb's normalised screen position for the burst origin
    let originX = 0.5;
    let originY = 0.1;
    if (lampDivRef.current) {
      const rect = lampDivRef.current.getBoundingClientRect();
      originX = (rect.left + rect.width / 2) / window.innerWidth;
      originY = (rect.top + rect.height * BULB_Y_FRACTION) / window.innerHeight;
    }

    // coverColor = CURRENT (old) theme's bg — the fill that hides the switch
    // pixelColor = contrasting flash — same convention as PixelBurstReveal
    const coverColor = isDark ? "#000000" : "#ffffff";
    const pixelColor = isDark ? "#ffffff" : "#000000";

    transitionRef.current.trigger({
      origin: { x: originX, y: originY },
      coverColor,
      pixelColor,
      onToggle: toggleTheme,
      duration: 2.0,
    });
  };

  const canvasBg = isDark ? "#000000" : "#ffffff";
  const coverColor = isDark ? "#000000" : "#ffffff";
  const pixelColor = isDark ? "#ffffff" : "#000000";
  const textColor = isDark ? "#ffffff" : "#000000";

  return (
    <div className="relative h-screen">
      {/* Main canvas – IntroText owns the camera */}
      <Canvas
        camera={{ manual: true }}
        style={{ background: canvasBg, width: "100%", height: "100%" }}
      >
        <IntroText
          onIntroComplete={() => setIntroComplete(true)}
          isDark={isDark}
        />
      </Canvas>

      {/* "Hi, I'm" label */}
      <div
        className={cn(
          "pointer-events-none absolute left-[8%] top-[33%] z-20 user-select-none",
          introComplete ? "" : "hidden",
        )}
      >
        <PixelBurstReveal
          ref={burstRef}
          origin="top-left"
          coverColor={coverColor}
          pixelColor={pixelColor}
          duration={2.0}
          textMode
          maskText="Hi, I'm"
          maskFont="400 30px Aldrich"
          maskLetterSpacing="1.2px"
          maskOffsetX={9}
        >
          <span
            className={cn(
              "block text-3xl font-normal whitespace-nowrap",
              "tracking-[0.04em] py-[0.15em] px-[0.3em] select-none",
            )}
            style={{ fontFamily: "var(--font-aldrich)", color: textColor }}
          >
            Hi, I&apos;m
          </span>
        </PixelBurstReveal>
      </div>

      {/* "3D Web Developer" label — centred horizontally */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 top-[55%] z-20 select-none",
          introComplete ? "" : "hidden",
        )}
      >
        <PixelBurstReveal
          ref={burstRef2}
          origin="center"
          coverColor={coverColor}
          pixelColor={pixelColor}
          duration={2.0}
          textMode
          maskText="3D Web Developer"
          maskFont="400 30px Aldrich"
          maskLetterSpacing="1.2px"
          maskOffsetX={9}
        >
          <span
            className={cn(
              "block text-3xl font-normal whitespace-nowrap",
              "tracking-[0.04em] py-[0.15em] px-[0.3em] select-none",
            )}
            style={{ fontFamily: "var(--font-aldrich)", color: textColor }}
          >
            3D Web Developer
          </span>
        </PixelBurstReveal>
      </div>

      {/* Lamp: springs in from top-center after bursts complete */}
      {lampVisible && (
        <div
          ref={lampDivRef}
          className="absolute left-1/2 -translate-x-1/2 top-0 z-30 w-96 h-70 pointer-events-auto"
        >
          <Canvas
            camera={{ position: [0, 0, 4], fov: 40 }}
            gl={{ alpha: true }}
            style={{ background: "transparent", border: "2px solid green" }}
          >
            <ambientLight intensity={isDark ? 0.25 : 0.9} />
            <directionalLight position={[2, 4, 3]} intensity={0.6} />
            <DarkModeLamp isDark={isDark} onToggle={handleLampToggle} />
          </Canvas>
        </div>
      )}

      
    </div>
  );
}

export default ParentCanvas;
