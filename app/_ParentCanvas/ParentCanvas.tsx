"use client";

import { Canvas } from "@react-three/fiber";
import { useState, useRef, useEffect } from "react";
import IntroText from "../_Intro/IntroText";
import { useTheme } from "@/app/context/ThemeContext";
import { cn } from "@/utils/utils";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import AboutMe from "../_AboutMe/AboutMe";
import StackSection from "../_Stack/StackSection";
import ProjectsSection from "../_Projects/ProjectsSection";
import Contact from "../_Contact/Contact";
import Lenis from "lenis";
import HiImText from "../_Intro/HiImText";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";

gsap.registerPlugin(SplitText);

// ── Initial scroll target ────────────────────────────────────────────────────
// Set to a CSS selector to auto-scroll there on load, or null to start at top.
const INITIAL_SCROLL_TARGET: string | null = null;

// ── Typewriter component ──────────────────────────────────────────────────────
interface TypewriterLineProps {
  text: string;
  delay?: number; // seconds before this line starts typing
  color: string;
  fontFamily?: string;
  onComplete?: () => void;
}

function TypewriterLine({
  text,
  delay = 0,
  color,
  fontFamily,
  onComplete,
}: TypewriterLineProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    const cursor = cursorRef.current;
    if (!container || !cursor || !wrapper) return;

    const split = new SplitText(container, { type: "chars" });
    const chars = split.chars;

    const moveCursorAfter = (el: Element) => {
      const r = el.getBoundingClientRect();
      const wr = wrapper.getBoundingClientRect();
      cursor.style.left = `${r.right - wr.left}px`;
      cursor.style.top = `${r.top - wr.top}px`;
    };

    // Initial cursor position: start of text (before first char)
    const firstRect = chars[0]?.getBoundingClientRect();
    const wr = wrapper.getBoundingClientRect();
    if (firstRect) {
      cursor.style.left = `${firstRect.left - wr.left}px`;
      cursor.style.top = `${firstRect.top - wr.top}px`;
    }

    container.style.visibility = "visible";
    gsap.set(chars, { autoAlpha: 0 });
    gsap.set(cursor, { autoAlpha: 0 });

    const typeTl = gsap.timeline({ delay });

    // Show cursor and start blinking only after the delay
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
  }, [text, delay]); // onComplete intentionally excluded — accessed via ref

  return (
    <span
      ref={wrapperRef}
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily,
        color,
      }}
    >
      <div
        ref={containerRef}
        style={{ display: "inline", visibility: "hidden" }}
      >
        {text}
      </div>
      {/* Blinking white cursor — absolutely positioned, follows last typed char */}
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

function ParentCanvas({
  onIntroComplete,
}: { onIntroComplete?: () => void } = {}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isSmallScreen = isMobile || isTablet;

  const [introComplete, setIntroComplete] = useState(isSmallScreen);
  const [secondLineDone, setSecondLineDone] = useState(isSmallScreen);

  const arrowRef = useRef<SVGSVGElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const lenisRafRef = useRef<number | null>(null);

  // Global smooth scrolling instance
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    // Intro starts locked; keep Lenis paused until the second line finishes.
    // On mobile, don't lock — scroll is available immediately.
    if (isSmallScreen) {
      // Keep GSAP ScrollTrigger in sync with Lenis scroll position
      lenis.on("scroll", ScrollTrigger.update);

      const onFrame = (time: number) => {
        lenis.raf(time);
        lenisRafRef.current = window.requestAnimationFrame(onFrame);
      };
      lenisRafRef.current = window.requestAnimationFrame(onFrame);

      return () => {
        if (lenisRafRef.current !== null) {
          window.cancelAnimationFrame(lenisRafRef.current);
        }
        lenis.destroy();
        lenisRef.current = null;
      };
    }

    lenis.stop();
    lenis.scrollTo(0, { immediate: true });

    // Keep GSAP ScrollTrigger in sync with Lenis scroll position
    lenis.on("scroll", ScrollTrigger.update);

    const onFrame = (time: number) => {
      lenis.raf(time);
      lenisRafRef.current = window.requestAnimationFrame(onFrame);
    };

    lenisRafRef.current = window.requestAnimationFrame(onFrame);

    return () => {
      if (lenisRafRef.current !== null) {
        window.cancelAnimationFrame(lenisRafRef.current);
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isSmallScreen]);

  // Keep Lenis in sync with intro lock state.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    if (!secondLineDone) {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true });
      return;
    }

    lenis.start();
  }, [secondLineDone]);

  // Scroll arrow: fade+slide in, blink twice every 5s, stop on scroll
  useEffect(() => {
    if (!secondLineDone) return;
    const arrow = arrowRef.current;
    if (!arrow) return;

    let firstBlinkTimeout: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isArrowVisible = false;
    let activeBlinkTl: gsap.core.Timeline | null = null;

    const clearBlinkTimers = () => {
      if (firstBlinkTimeout) {
        clearTimeout(firstBlinkTimeout);
        firstBlinkTimeout = null;
      }
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      activeBlinkTl?.kill();
      activeBlinkTl = null;
    };

    const blink = () => {
      if (!isArrowVisible) return;
      activeBlinkTl?.kill();
      activeBlinkTl = gsap
        .timeline()
        .to(arrow, { autoAlpha: 0, y: 6, duration: 0.18, ease: "back.in(1.5)" })
        .to(arrow, {
          autoAlpha: 1,
          y: 0,
          duration: 0.18,
          ease: "back.out(1.5)",
        })
        .to(arrow, { autoAlpha: 0, y: 6, duration: 0.18, ease: "back.in(1.5)" })
        .to(arrow, {
          autoAlpha: 1,
          y: 0,
          duration: 0.18,
          ease: "back.out(1.5)",
        });
    };

    const startBlinkCycle = () => {
      clearBlinkTimers();
      firstBlinkTimeout = setTimeout(() => {
        blink();
        intervalId = setInterval(blink, 5000);
      }, 5000);
    };

    const showArrow = () => {
      if (isArrowVisible) return;
      isArrowVisible = true;
      gsap.killTweensOf(arrow);
      gsap.fromTo(
        arrow,
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "back.out(1.7)",
        },
      );
      startBlinkCycle();
    };

    const hideArrow = () => {
      if (!isArrowVisible) return;
      isArrowVisible = false;
      clearBlinkTimers();
      gsap.killTweensOf(arrow);
      gsap.to(arrow, {
        autoAlpha: 0,
        y: 8,
        duration: 0.4,
        ease: "back.in(1.5)",
      });
    };

    const onScrollOrResize = () => {
      const atTop = window.scrollY <= 0;
      if (atTop) {
        showArrow();
      } else {
        hideArrow();
      }
    };

    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      clearBlinkTimers();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      gsap.killTweensOf(arrow);
    };
  }, [secondLineDone]);

  // Keep scroll position at top during intro (Lenis .lenis-stopped class handles overflow lock).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!secondLineDone) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [secondLineDone]);

  // Auto-scroll to INITIAL_SCROLL_TARGET once intro is done and Lenis is running.
  useEffect(() => {
    if (!secondLineDone || !INITIAL_SCROLL_TARGET) return;
    const lenis = lenisRef.current;
    if (!lenis) return;

    // Small delay to let ScrollTrigger pins settle after Lenis starts.
    const id = setTimeout(() => {
      lenis.scrollTo(INITIAL_SCROLL_TARGET, { immediate: true });
    }, 100);
    return () => clearTimeout(id);
  }, [secondLineDone]);

  const canvasBg = isDark ? "#000000" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";

  const handleIntroStart = () => {
    setIntroComplete(false);
    setSecondLineDone(false);
  };

  const handleIntroComplete = () => {
    setIntroComplete(true);
    onIntroComplete?.();
  };

  return (
    <div className="relative h-screen">
      
        <>
          {/* Main canvas – IntroText owns the camera */}
          <Canvas
            camera={{ manual: true }}
            style={{
              background: canvasBg,
              width: "100%",
              height: "100%",
              zIndex: 20,
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 10, 10]} intensity={1} />
            <IntroText
              onIntroStart={handleIntroStart}
              onIntroComplete={handleIntroComplete}
              isDark={isDark}
            />
            {isMobile ? null : (
              <>
            <HiImText
              visible={introComplete}
              isDark={isDark}
              showScrollText={secondLineDone}
            />
            <EffectComposer>
              <Bloom
                intensity={0.1}
                luminanceThreshold={0.6}
                luminanceSmoothing={0.4}
                mipmapBlur
              />
              <Noise opacity={0.06} blendFunction={BlendFunction.SOFT_LIGHT} />
              <Vignette
                offset={0.3}
                darkness={0.7}
                blendFunction={BlendFunction.NORMAL}
              />
            </EffectComposer>
            </>
            )}
          </Canvas>

          {/* "3D AI Engineer" label — centred horizontally, always mounted */}
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 -translate-x-1/2 top-[50%] z-50 select-none lg:top-[55%]",
              introComplete ? "visible" : "invisible",
            )}
          >
            <span
              className={cn(
                "block text-2xl font-normal whitespace-nowrap lg:text-3xl",
                "tracking-[0.04em] py-[0.15em] px-[0.3em] select-none ",
              )}
            >
              {introComplete && (
                <TypewriterLine
                  text="Full Stack AI Engineer"
                  delay={1}
                  color={textColor}
                  fontFamily="var(--font-aldrich)"
                  onComplete={() => setSecondLineDone(true)}
                />
              )}
            </span>
          </div>
        </>

      {/* Scroll arrow — bottom center, desktop only */}
      {!isSmallScreen && (
        <svg
          ref={arrowRef}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-1/2 h-10 w-10 -translate-x-1/2 opacity-0 z-20 bottom-48 lg:bottom-8"
          style={{ visibility: secondLineDone ? "visible" : "hidden" }}
        >
          <path
            d="M17 9.5L12 14.5L7 9.5"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {/* About Me section */}

      <AboutMe shouldAnimate={secondLineDone} />
      <StackSection />
      <ProjectsSection />
      <Contact />
    </div>
  );
}

export default ParentCanvas;
