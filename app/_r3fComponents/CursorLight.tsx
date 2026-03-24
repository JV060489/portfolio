"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const LIGHT_SIZE = 400;

export default function CursorLight() {
  const lightRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = lightRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;

      gsap.to(el, {
        x: pos.current.x - LIGHT_SIZE / 2,
        y: pos.current.y - LIGHT_SIZE / 2,
        duration: 0.6,
        ease: "power2.out",
        overwrite: true,
      });

      gsap.to(el, {
        opacity: 1,
        duration: 0.3,
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      gsap.to(el, {
        opacity: 0,
        duration: 1,
        ease: "power2.out",
      });
    };

    const onEnter = (e: PointerEvent) => {
      // Snap position immediately on re-enter, then animate opacity
      gsap.set(el, {
        x: e.clientX - LIGHT_SIZE / 2,
        y: e.clientY - LIGHT_SIZE / 2,
      });
      gsap.to(el, {
        opacity: 1,
        duration: 0.3,
      });
    };

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <div
      ref={lightRef}
      className="fixed top-0 left-0 pointer-events-none z-50 rounded-full opacity-0"
      style={{
        width: LIGHT_SIZE,
        height: LIGHT_SIZE,
        background:
          "radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
