"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GSDevTools } from "gsap/all";
import ProjectPage, { type ProjectPageProps } from "./ProjectPage";

gsap.registerPlugin(useGSAP, ScrollTrigger, GSDevTools);

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
const PROJECTS: (ProjectPageProps & { key: string })[] = [
  {
    key: "portal",
    title: "PORTAL",
    titlePosition: { x: "-5%", y: "45%" },
    titleParallaxSpeed: 1.15,
    subText: "AI Editor",
    subTextPosition: { x: "10%", y: "53%" },
    description: "Next-gen 3D editor with integrated AI text-to-scene capabilities.",
    descriptionPosition: { x: "60%", y: "42%" },
    livingCardImgSrc: "/Helper/portal-preview.png",
    spanText: "",
    spanPosition: { x: "25%", y: "20%" },
    spanSize: { width: "30%", height: "60%" },
  },
  {
    key: "vizualspace",
    title: "VIZUALSPACE",
    titlePosition: { x: "0%", y: "30%" },
    titleParallaxSpeed: 1.15,
    subText: "WebXR Catalogue",
    subTextPosition: { x: "15%", y: "38%" },
    description: "A curated universe of browser-based spatial experiences",
    descriptionPosition: { x: "65%", y: "52%" },
    livingCardImgSrc: "/Helper/portal-preview.png",
    spanText: "",
    spanPosition: { x: "35%", y: "25%" },
    spanSize: { width: "22.5%", height: "55%" },
  },
  {
    key: "arc",
    title: "ARC IITM",
    titlePosition: { x: "10%", y: "45%" },
    titleParallaxSpeed: 1.15,
    subText: "Internship",
    subTextPosition: { x: "20%", y: "53%" },
    description:
      "Architected an immersive XR application integrating AI and 3D workflows to enhance digital accessibility for users with disabilities.",
    descriptionPosition: { x: "35%", y: "35%" },
    livingCardImgSrc: "/Helper/portal-preview.png",
    spanText: "",
    spanPosition: { x: "20%", y: "25%" },
    spanSize: { width: "35%", height: "50%" },
    showLivingCard: false,
  },
  {
    key: "freelance",
    title: "Independent \n Engineer",
    titleNewLine: true,
    titlePosition: { x: "-15%", y: "35%" },
    titleParallaxSpeed: 1.15,
    subText: "Contract Work",
    subTextPosition: { x: "0%", y: "53%" },
    description:
      "Partnered with a diverse portfolio of startups and government agencies to deploy high-impact 3D and XR solutions",
    descriptionPosition: { x: "20%", y: "35%" },
    livingCardImgSrc: "/Helper/portal-preview.png",
    spanText: "",
    spanPosition: { x: "30%", y: "25%" },
    spanSize: { width: "35%", height: "50%" },
    showLivingCard: false,
  },
  {
    key: "inter-iit",
    title: "3D Animation",
    titlePosition: { x: "-20%", y: "35%" },
    titleParallaxSpeed: 1.15,
    subText: "INTER-IIT",
    subTextPosition: { x: "-5%", y: "43%" },
    description:
      "Led a 5-person technical team to engineer a full-scale 3D production pipeline; overseen bespoke character modeling, rigging, and high-fidelity animation for a competitive cinematic entry.",
    descriptionPosition: { x: "40%", y: "35%" },
    livingCardImgSrc: "/Helper/portal-preview.png",
    spanText: "",
    spanPosition: { x: "20%", y: "10%" },
    spanSize: { width: "15%", height: "75%" },
  },
];

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

      const screensPerProject = 1.5;
      const totalSlides = 1 + PROJECTS.length * screensPerProject; // title + projects (2 each)
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

        // Each project occupies 2 slides; add 1 screen buffer on each side for parallax
        const projectStartSlide = Math.max(0, 1 + i * screensPerProject - 1);
        const projectEndSlide = Math.min(totalSlides, 1 + (i + 1) * screensPerProject + 1);

        const parallaxScreens = projectEndSlide - projectStartSlide;
        const parallaxAmount = parallaxScreens * 100 * (project.titleParallaxSpeed - 1); // vw

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
        style={{ width: `${(1 + PROJECTS.length * 1.5) * 100}vw` }}
      >
        {/* Screen 1 — Title */}
        <div className="relative w-screen h-full flex items-center justify-center shrink-0 bg-black">
          <RepulseText
            text="Experience"
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
