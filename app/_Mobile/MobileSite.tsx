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
import { siteContent } from "@/app/content/siteContent";

gsap.registerPlugin(SplitText);

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

// ── Shared content ──────────────────────────────────────────────────────────

type MobileProject = {
  key: string;
  title: string;
  subText: string;
  description: string;
  imageSrc?: string;
  videoSrc?: string;
  aspectRatio?: string;
  showCard?: boolean;
};

const LEFT_STACK = siteContent.stack.left.map((item) => item.label);
const RIGHT_STACK = siteContent.stack.right.map((item) => item.label);
const PROJECTS: MobileProject[] = siteContent.projects.items.map((project) => ({
  ...project,
}));
const SOCIALS = siteContent.contact.socials;
const BIO_TEXT = siteContent.about.bioText;

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

function TypewriterSubtitle({
  onComplete,
  color,
}: {
  onComplete?: () => void;
  color: string;
}) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    const cursor = cursorRef.current;
    if (!wrapper || !container || !cursor) return;

    const split = new SplitText(container, { type: "chars" });
    const chars = split.chars;

    const moveCursorAfter = (el: Element) => {
      const r = el.getBoundingClientRect();
      const wr = wrapper.getBoundingClientRect();
      cursor.style.left = `${r.right - wr.left}px`;
      cursor.style.top = `${r.top - wr.top}px`;
    };

    const firstRect = chars[0]?.getBoundingClientRect();
    const wr = wrapper.getBoundingClientRect();
    if (firstRect) {
      cursor.style.left = `${firstRect.left - wr.left}px`;
      cursor.style.top = `${firstRect.top - wr.top}px`;
    }

    container.style.visibility = "visible";
    gsap.set(chars, { autoAlpha: 0 });
    gsap.set(cursor, { autoAlpha: 0 });

    const typeTl = gsap.timeline({ delay: 0.6 });
    const blinkTl = gsap.timeline({ repeat: -1, paused: true });

    blinkTl
      .to(cursor, { autoAlpha: 0, duration: 0.4, ease: "none" })
      .to(cursor, { autoAlpha: 1, duration: 0.4, ease: "none" });

    typeTl.set(cursor, { autoAlpha: 1 });
    typeTl.add(() => {
      blinkTl.play();
    });

    typeTl.to(chars, {
      autoAlpha: 1,
      duration: 0.001,
      stagger: {
        amount: chars.length * 0.07,
        onStart() {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const char = (this as any).targets()[0] as Element;
          moveCursorAfter(char);
        },
      },
      ease: "none",
      onComplete: () => {
        blinkTl.kill();
        gsap.set(cursor, { autoAlpha: 0 });
        onCompleteRef.current?.();
      },
    });

    return () => {
      typeTl.kill();
      blinkTl.kill();
      split.revert();
    };
  }, []);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-block text-xl font-aldrich tracking-widest"
      style={{ color }}
    >
      <span ref={containerRef} style={{ visibility: "hidden" }}>
        {siteContent.hero.subtitle}
      </span>
      <span
        ref={cursorRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          width: "3px",
          height: "1em",
          background: "#ffffff",
          opacity: 0,
        }}
      />
    </span>
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
  const textColor = isDark ? "#ffffff" : "#000000";

  const handleSubtitleComplete = () => {
    onSubtitleComplete();
    setShowArrow(true);
  };

  return (
    <section className="relative min-h-svh flex flex-col items-center justify-center">
      {/* R3F Canvas for the dithered grid intro — stays mounted */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-10">
        {canvasMounted && (
          <Canvas
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
          </Canvas>
        )}
      </div>

      {/* Typewriter subtitle — appears over the canvas after intro */}
      <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none mt-32">
        {showSubtitle && (
          <TypewriterSubtitle
            onComplete={handleSubtitleComplete}
            color={textColor}
          />
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
      {!scrollLocked && (
        <>
          {/* About Me */}
          <section className="px-6 py-16">
            <FadeIn delay={0.1}>
              <h2 className="text-4xl font-semibold font-aldrich text-center mb-8">
                {siteContent.sections.aboutMe}
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
                {siteContent.sections.stack}
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
                {siteContent.sections.experience}
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
                    {project.showCard !== false && (
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
                      href={`mailto:${siteContent.contact.email}`}
                      className="group inline-flex select-none items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-transform duration-200 active:scale-[0.96] font-aldrich"
                    >
                      {siteContent.contact.email}
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
        </>
      )}
    </div>
  );
}
