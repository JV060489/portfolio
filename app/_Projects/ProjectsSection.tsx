"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { GSDevTools } from "gsap/all";
import ProjectPage, { type ProjectPageProps } from "./ProjectPage";
import { siteContent } from "@/app/content/siteContent";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, GSDevTools);

// ── Magnetic repulsion (for the "Experience" title) ─────────────────────────
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

// ── Project data ────────────────────────────────────────────────────────────
const PROJECT_BY_KEY = Object.fromEntries(
  siteContent.projects.items.map((project) => [project.key, project]),
);

const PROJECTS: (ProjectPageProps & { key: string })[] =
  siteContent.projects.desktop.order.map((key) => {
    const content = PROJECT_BY_KEY[key];
    const layout = siteContent.projects.desktop.layouts[key];

    return {
      key,
      title: layout.title ?? content.title,
      titlePosition: layout.titlePosition,
      titleParallaxSpeed: layout.titleParallaxSpeed,
      subText: content.subText,
      subTextPosition: layout.subTextPosition,
      description: content.description,
      descriptionPosition: layout.descriptionPosition,
      descTriggerOffset: layout.descTriggerOffset,
      livingCardImgSrc: content.imageSrc ?? "/Helper/portal-preview.png",
      livingCardVideoSrc: content.videoSrc,
      spanText: layout.spanText,
      spanPosition: layout.spanPosition,
      spanSize: layout.spanSize,
      showLivingCard: layout.showLivingCard,
      titleNewLine: layout.titleNewLine,
      screens: layout.screens,
    };
  });

// ── Main component ──────────────────────────────────────────────────────────
export default function ProjectsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // One ref per project for parallax
  const parallaxRefs = useRef<(HTMLDivElement | null)[]>(
    PROJECTS.map(() => null),
  );

  useGSAP(
    () => {
      if (!sectionRef.current || !trackRef.current) return;

      const projectScreens = PROJECTS.map((p) => p.screens ?? 1.5);
      const totalSlides = 1 + projectScreens.reduce((sum, s) => sum + s, 0);
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

      // Per-project parallax — added to the same timeline so pin is respected
      PROJECTS.forEach((project, i) => {
        const el = parallaxRefs.current[i];
        if (!el) return;

        // Cumulative start position for this project + 1 screen buffer each side for parallax
        const cumulativeBefore = projectScreens
          .slice(0, i)
          .reduce((s, v) => s + v, 0);
        const projectStartSlide = Math.max(0, 1 + cumulativeBefore - 1);
        const projectEndSlide = Math.min(
          totalSlides,
          1 + cumulativeBefore + projectScreens[i] + 1,
        );

        const parallaxScreens = projectEndSlide - projectStartSlide;
        const parallaxAmount =
          parallaxScreens * 100 * (project.titleParallaxSpeed - 1); // vw

        tl.fromTo(
          el,
          { x: `${parallaxAmount / 2}vw` },
          {
            x: `${-parallaxAmount / 2}vw`,
            ease: "none",
            duration: projectEndSlide - projectStartSlide,
          },
          projectStartSlide, // position in timeline matches the slide
        );
      });

      // ── Split-text scroll reveal for all [data-split-anim] elements ────────
      const origins: [number, number][] = [
        [-60, -30], // left top
        [-60, 30], // left bottom
        [60, 30], // right bottom
      ];

      const splitAnimEls =
        sectionRef.current!.querySelectorAll<HTMLElement>("[data-split-anim]");

      splitAnimEls.forEach((el) => {
        const triggerOffset = el.dataset.triggerOffset || "0%";
        const origin = origins[Math.floor(Math.random() * origins.length)];
        const [xDir, yDir] = origin;
        const split = SplitText.create(el, { type: "lines" });

        gsap.set(split.lines, { opacity: 0, x: xDir, y: yDir });

        gsap.to(split.lines, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "power1.out",
          stagger: 0.15,
          paused: true,
          scrollTrigger: {
            trigger: el,
            containerAnimation: tl,
            start: `left+=${(parseFloat(triggerOffset) / 100) * window.innerWidth}px 100%`,
            once: true,
          },
        });
      });
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <div
      id="projects-section"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      {/* Horizontal track */}
      <div
        ref={trackRef}
        className="absolute top-0 left-0 h-full flex will-change-transform"
        style={{
          width: `${(1 + PROJECTS.reduce((sum, p) => sum + (p.screens ?? 1.5), 0)) * 100}vw`,
        }}
      >
        {/* Screen 1 — Title */}
        <div className="relative w-screen h-full flex items-center justify-center shrink-0 bg-black">
          <RepulseText
            text={siteContent.sections.experience}
            className="text-8xl font-aldrich font-semibold text-white select-none"
          />
        </div>

        {/* Project pages */}
        {PROJECTS.map(({ key, ...project }, i) => (
          <ProjectPage
            key={key}
            {...project}
            parallaxRef={{
              get current() {
                return parallaxRefs.current[i];
              },
              set current(el) {
                parallaxRefs.current[i] = el;
              },
            }}
          />
        ))}
      </div>
    </div>
  );
}
