"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GSDevTools } from "gsap/all";
import { LivingCard } from "./LivingCard";

gsap.registerPlugin(useGSAP, ScrollTrigger, GSDevTools);

// ── Magnetic repulsion (same logic as AboutMe) ────────────────────────────────
const REPULSE_RADIUS = 100;
const REPULSE_STRENGTH = 28;

function useCharRepulsion(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chars = Array.from(
      container.querySelectorAll<HTMLElement>(".repulse-char"),
    );

    const handleMouseMove = (e: MouseEvent) => {
      chars.forEach((char) => {
        const rect = char.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPULSE_RADIUS) {
          const force = (1 - dist / REPULSE_RADIUS) * REPULSE_STRENGTH;
          const offsetX = -(dx / dist) * force;
          const offsetY = -(dy / dist) * force;
          gsap.to(char, {
            x: offsetX,
            y: offsetY,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else {
          gsap.to(char, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.4)",
            overwrite: "auto",
          });
        }
      });
    };

    const handleMouseLeave = () => {
      chars.forEach((char) => {
        gsap.to(char, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.4)",
          overwrite: "auto",
        });
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [containerRef]);
}

function RepulseText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  useCharRepulsion(containerRef);

  return (
    <h2 ref={containerRef} className={className}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="repulse-char inline-block cursor-default"
          style={{ whiteSpace: char === " " ? "pre" : undefined }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h2>
  );
}

// ── Project 1 parallax config ────────────────────────────────────────────────
const PROJECT_1_SPEED = 1.15;       // multiplier vs background scroll speed
const PROJECT_1_POSITION = { x: 200, y: 0 }; // px offset from center

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const parallaxTextRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !trackRef.current) return;

      const totalSlides = 7;
      const travelDistance = (totalSlides - 1) * 100; // vw

      const tl = gsap
        .timeline({
          id: "projects-scroll",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${totalSlides * 100}%`,
            scrub: 1,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
          },
        })

        .to(trackRef.current, {
          x: `-${travelDistance}vw`,
          ease: "none",
          duration: totalSlides - 1,
        });

      // Parallax: PORTAL text moves faster than the background track
      if (parallaxTextRef.current) {
        gsap.to(parallaxTextRef.current, {
          x: () => `${-(travelDistance * (PROJECT_1_SPEED - 1))}vw`,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${totalSlides * 100}%`,
            scrub: 1,
          },
        });
      }

      GSDevTools.create({ animation: tl });
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <div
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      {/* Horizontal track — 7 screens wide */}
      <div
        ref={trackRef}
        className="absolute top-0 left-0 h-full flex will-change-transform"
        style={{ width: `${7 * 100}vw` }}
      >
        {/* Screen 1 — Title */}
        <div className="relative w-screen h-full flex items-center justify-center shrink-0 bg-black">
          <RepulseText
            text="Experience"
            className="text-8xl font-aldrich font-semibold text-white select-none"
          />
        </div>

        {/* Screen 2 — Project 1: PORTAL parallax */}
        <div className="relative w-screen h-full shrink-0 flex items-center bg-black overflow-visible">
          {/* Left: parallax title */}
          <div
            ref={parallaxTextRef}
            className="absolute text-5xl font-aldrich font-bold text-white select-none tracking-[0.25em] uppercase will-change-transform"
            style={{
              transform: `translate(${PROJECT_1_POSITION.x}px, ${PROJECT_1_POSITION.y}px)`,
            }}
          >
            PORTAL
          </div>

          {/* Right-center: living card linking to projects portal */}
          <div className="absolute inset-0 flex items-center justify-center">
            <LivingCard
              imageSrc="/Helper/portal-preview.png"
              alt="portal"
              className="w-85 h-100"
              onClick={() => window.open("/projects", "_self")}
              overlay={
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-aldrich font-semibold text-white tracking-wide">
                    Portal
                  </span>
                </div>
              }
            />
          </div>
        </div>

        {/* Screens 3-7 — placeholder panels */}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="relative w-screen h-full shrink-0 flex items-center justify-center bg-black"
          >
            <span className="text-white font-aldrich text-2xl tracking-widest uppercase select-none">
              Project {i + 2}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
