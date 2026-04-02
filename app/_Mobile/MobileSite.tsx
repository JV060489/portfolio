"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Canvas } from "@react-three/fiber";
import IntroText from "../_Intro/IntroText";
import { useTheme } from "@/app/context/ThemeContext";
import { AvatarMosaic } from "../_Contact/AvatarMosaic";
import { Magnetic } from "../_Contact/Magnetic";
import Image from "next/image";

gsap.registerPlugin(SplitText);

// ── Lightweight fade-in using IntersectionObserver + CSS transitions ─────────
// No Framer Motion — avoids layout thrashing on mobile scroll.

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        filter: visible ? "blur(0px)" : "blur(6px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s, filter 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────

const LEFT_STACK = [
  "Next.js",
  "Express",
  "Git",
  "React",
  "Tailwind",
  "JavaScript",
  "TypeScript",
  "LangChain",
];
const RIGHT_STACK = [
  "Three.js",
  "GSAP",
  "WebGL",
  "Blender",
  "ComfyUI",
  "Pytorch",
  "Python",
  "HuggingFace",
];

const PROJECTS = [
  {
    key: "portal",
    title: "PORTAL",
    subText: "AI Editor",
    description:
      "Architected a real-time collaborative 3D engine featuring an AI-driven inference pipeline that synchronizes web-based inputs with Blender via a custom Python plugin.",
    imageSrc: "/Helper/portal-preview.png",
  },
  {
    key: "vizualspace",
    title: "VIZUALSPACE",
    subText: "Founding Engineer",
    description:
      "Developed a full-stack WebXR discovery platform using React, Next.js, R3F, and AWS while leading a lean technical team",
    imageSrc: "/Helper/portal-preview.png",
  },
  {
    key: "arc",
    title: "ARC IITM",
    subText: "Internship",
    description:
      "Developed a Unity-based XR ecosystem featuring on-device Computer Vision and Dolby Atmos spatial mapping to bridge the gap between physical 3D assets and digital accessibility.",
    showCard: false,
  },
  {
    key: "freelance",
    title: "Independent Engineer",
    subText: "Contract Work",
    description:
      "Partnered with a diverse portfolio of startups and government agencies to deploy high-impact 3D and AI solutions",
    showCard: false,
  },
  {
    key: "inter-iit",
    title: "3D Animation",
    subText: "INTER-IIT",
    description:
      "Led a team of 5 to create a 3D animated short for the Inter-IIT Meet—India's premier engineering assembly where the top 0.01% of technical talent competes—overseeing all aspects from concept to post-production",
    videoSrc:
      "https://ehhcbsxrpaziywth.public.blob.vercel-storage.com/Riseup.mp4",
    aspectRatio: "9/16" as const,
  },
];

const SOCIALS = [
  { name: "GitHub", href: "https://github.com/JV060489" },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/janarthanan-vasanth-64ba45257/",
  },
];

const BIO_TEXT =
  "Final-year at IIT Madras by day, digital architect by night. I thrive at the intersection of Generative AI and the Full-Stack, specializing in shipping high-fidelity, interactive experiences that transform the standard URL into an intelligent canvas. From training custom models to seamless deployments, I build the future of the web, one pipeline at a time.";

// ── Animated tech list using IntersectionObserver ────────────────────────────

function MobileTechList({
  items,
  side,
}: {
  items: string[];
  side: "left" | "right";
}) {
  const total = items.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const spans = el.querySelectorAll<HTMLElement>("span");
          gsap.fromTo(
            spans,
            { x: side === "left" ? -200 : 200, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.06,
              ease: "back.out(1.7)",
            },
          );
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [side]);

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {items.map((name, i) => {
        const norm = (i / (total - 1)) * 2 - 1;
        const indent = Math.round((1 - norm * norm) * 40);
        return (
          <span
            key={name}
            style={{
              [side === "left" ? "paddingLeft" : "paddingRight"]: `${indent}px`,
              letterSpacing: `${0.04 + (1 - norm * norm) * 0.06}em`,
              opacity: 0,
            }}
            className={`block text-base font-aldrich text-neutral-400 ${
              side === "right" ? "text-right" : "text-left"
            }`}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}


// ── Typewriter for subtitle ─────────────────────────────────────────────────

function TypewriterSubtitle({ onComplete }: { onComplete?: () => void }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const split = SplitText.create(el, { type: "chars" });
    gsap.set(split.chars, { opacity: 0 });

    gsap.to(split.chars, {
      opacity: 1,
      duration: 0.01,
      stagger: 0.05,
      ease: "none",
      delay: 0.6,
      onComplete: () => onCompleteRef.current?.(),
    });

    return () => split.revert();
  }, []);

  return (
    <p
      ref={containerRef}
      className="text-xl font-aldrich tracking-widest text-neutral-400"
    >
      Full Stack AI Engineer
    </p>
  );
}

// ── Hero section with R3F IntroText dithering + typewriter subtitle ─────────

function MobileHero({
  onIntroComplete,
  onSubtitleComplete,
}: {
  onIntroComplete: () => void;
  onSubtitleComplete: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [canvasMounted, setCanvasMounted] = useState(false);
  const canvasContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setCanvasMounted(true);
  }, []);
  const canvasBg = isDark ? "#000000" : "#ffffff";

  const handleSubtitleComplete = () => {
    onSubtitleComplete();
    setShowArrow(true);
  };

  return (
    <section className="relative min-h-svh flex flex-col items-center justify-center">
      {/* R3F Canvas for the dithered grid intro — stays mounted */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-10">
        {canvasMounted && <Canvas
          camera={{ manual: true }}
          style={{
            background: canvasBg,
            width: "100%",
            height: "100%",
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 10, 10]} intensity={1} />
          <IntroText
            onIntroComplete={() => {
              setShowSubtitle(true);
              onIntroComplete();
            }}
            isDark={isDark}
            forceMobile
          />
        </Canvas>}
      </div>

      {/* Typewriter subtitle — appears over the canvas after intro */}
      <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none mt-32">
        {showSubtitle && (
          <TypewriterSubtitle onComplete={handleSubtitleComplete} />
        )}
      </div>

      {/* Scroll down arrow */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 h-8 w-8"
        style={{
          opacity: showArrow ? 1 : 0,
          transform: `translateX(-50%) translateY(${showArrow ? "0px" : "16px"})`,
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <path
          d="M17 9.5L12 14.5L7 9.5"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </section>
  );
}

// ── Main MobileSite ─────────────────────────────────────────────────────────

export default function MobileSite() {
  const [scrollLocked, setScrollLocked] = useState(true);

  useEffect(() => {
    if (scrollLocked) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.body.style.position = "fixed";
      document.body.style.inset = "0";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.position = "";
      document.body.style.inset = "";
      document.body.style.width = "";
      window.scrollTo(0, 0);
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.position = "";
      document.body.style.inset = "";
      document.body.style.width = "";
    };
  }, [scrollLocked]);

  return (
    <div className="w-full overflow-x-hidden bg-black text-white">
      {/* Hero */}
      <MobileHero
        onIntroComplete={() => {}}
        onSubtitleComplete={() => setScrollLocked(false)}
      />

      {/* Content only mounts after intro — prevents scrollbar flash */}
      {!scrollLocked && <>

      {/* About Me */}
      <section className="px-6 py-16">
        
        <FadeIn delay={0.1}>
          <h2 className="text-4xl font-semibold font-aldrich text-center mb-8">
            About Me
          </h2>
        </FadeIn>
        <div className="relative w-full aspect-video mb-8">
            <Image
              src="https://ehhcbsxrpaziywth.public.blob.vercel-storage.com/AboutMeModel.png"
              alt="Tech cubes"
              fill
              className="object-cover rounded-xl"
            />
          </div>
        <FadeIn>
          <p className="text-base leading-relaxed font-aldrich text-neutral-300">
            {BIO_TEXT}
          </p>
        </FadeIn>
      </section>

      {/* Stack */}
      <section className="px-6 py-16">
        <FadeIn delay={0.1}>
          <h2 className="text-4xl font-semibold font-aldrich text-center mb-8">
            Stack
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="relative w-full aspect-video mb-8">
            <Image
              src="/Stack.png"
              alt="Tech cubes"
              fill
              className="object-cover rounded-xl"
            />
          </div>
        </FadeIn>
        <div className="grid grid-cols-2 gap-4">
          <MobileTechList items={LEFT_STACK} side="left" />
          <MobileTechList items={RIGHT_STACK} side="right" />
        </div>
      </section>

      {/* Experience / Projects */}
      <section className="px-6 py-16">
        <FadeIn delay={0.1}>
          <h2 className="text-4xl font-aldrich font-semibold text-center mb-12">
            Experience
          </h2>
        </FadeIn>
        <div className="flex flex-col gap-16">
          {PROJECTS.map((project, i) => (
            <FadeIn key={project.key} delay={0.1 + i * 0.08}>
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-aldrich font-bold tracking-widest uppercase">
                  {project.title}
                </h3>
                <p className="text-sm font-aldrich text-neutral-500 tracking-widest uppercase">
                  {project.subText}
                </p>
                {(project.showCard !== false) && (
                  <div
                    className="relative w-full overflow-hidden rounded-2xl bg-neutral-900"
                    style={{ aspectRatio: project.aspectRatio ?? "16/9" }}
                  >
                    {project.videoSrc ? (
                      <video
                        src={project.videoSrc}
                        loop
                        muted
                        playsInline
                        autoPlay
                        className="h-full w-full object-contain"
                      />
                    ) : project.imageSrc ? (
                      <Image
                        src={project.imageSrc!}
                        alt={project.title.toLowerCase()}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                )}
                <p className="text-base font-aldrich text-neutral-300 leading-relaxed italic">
                  {project.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-24">
        <div className="mx-auto flex max-w-[960px] flex-col items-center text-center">
          <AvatarMosaic className="mb-16" />

          <FadeIn delay={0.3}>
            <div className="mt-4">
              <Magnetic strength={0.15}>
                <a
                  href="mailto:vasanthjanarthanan@gmail.com"
                  className="group inline-flex select-none items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-transform duration-200 active:scale-[0.96] font-aldrich"
                >
                  vasanthjanarthanan@gmail.com
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                    &rarr;
                  </span>
                </a>
              </Magnetic>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="mt-12 flex gap-6">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-md font-aldrich text-neutral-500 transition-colors duration-200 hover:text-neutral-300"
                >
                  {s.name}
                </a>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      </>}
    </div>
  );
}
