"use client";

import { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { GSDevTools } from "gsap/GSDevTools";
import { Canvas } from "@react-three/fiber";
import CubesModelScene from "./CubesModel";
import CubeRain from "./CubeRain";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, GSDevTools);

export interface AnimationState {
  animationProgress: number;
}

const LEFT_LIST  = ["Next.js", "Express", "Git", "React", "Tailwind", "JavaScript", "TypeScript"];
const RIGHT_LIST = ["Three.js", "GSAP", "WebGL", "Modelling", "ComfyUI", "Pytorch", "Python", "HuggingFace"];

// Map display names → HoverCube names
const DISPLAY_TO_CUBE: Record<string, string> = {
  "Next.js": "Next",
  "Express": "Express",
  "Git": "Git",
  "React": "React",
  "Tailwind": "Tailwind",
  "JavaScript": "JS",
  "TypeScript": "Typescript",
  "Three.js": "ThreeJS",
  "GSAP": "GSAP",
  "WebGL": "Webgl",
  "Modelling": "Blender(Modelling)",
  "ComfyUI": "Comfy",
  "Pytorch": "Pytorch",
  "Python": "Python",
  "HuggingFace": "HuggingFace",
};

function TechList({ items, side, hoveredCube, settled }: { items: string[]; side: "left" | "right"; hoveredCube: string | null; settled: boolean }) {
  const total = items.length;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const spans = el.querySelectorAll("span");
    if (settled) {
      gsap.fromTo(spans,
        { x: side === "left" ? -320 : 320, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: "back.out(1.7)" }
      );
    } else {
      gsap.to(spans, {
        x: side === "left" ? -320 : 320,
        opacity: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: "back.in(1.7)",
      });
    }
  }, [settled, side]);

  return (
    <div
      ref={containerRef}
      className={`absolute top-1/2 font-aldrich -translate-y-1/2 flex flex-col gap-2 ${side === "left" ? "left-6" : "right-6"}`}
    >
      {items.map((name, i) => {
        const norm = (i / (total - 1)) * 2 - 1;
        const indent = Math.round((1 - norm * norm) * 60);
        const active = hoveredCube === DISPLAY_TO_CUBE[name];
        return (
          <span
            key={name}
            style={{
              [side === "left" ? "paddingLeft" : "paddingRight"]: `${indent}px`,
              letterSpacing: `${0.04 + (1 - norm * norm) * 0.06}em`,
              opacity: 0,
            }}
            className={`block text-xl transition-colors duration-300 ${
              active ? "text-white" : "text-neutral-500"
            } ${side === "right" ? "text-right" : "text-left"}`}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}

export default function StackSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0); // 0→1 across the full pin
  const [showRain, setShowRain] = useState(true);
  const [settled, setSettled] = useState(false);
  const [hoveredCube, setHoveredCube] = useState<string | null>(null);

  const modelState = useRef<AnimationState>({ animationProgress: 0 });

  // Drive `settled` from modelState outside R3F
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const p = modelState.current?.animationProgress ?? 0;
      setSettled(p >= 0.99);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useGSAP(
    () => {
      if (!sectionRef.current || !titleRef.current || !canvasWrapRef.current)
        return;

      const split = SplitText.create(titleRef.current, { type: "words" });

      // ONE Timeline to rule them all
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=500%", // The full pinning duration
          scrub: true,
          pin: true,
          pinSpacing: true,
          snap: {
            snapTo: [0, 0.4, 1], // Simplified snap points
            duration: { min: 0.5, max: 1.5 },
            delay: 0.1,
            ease: "power2.inOut",
          },
          onUpdate: (self) => {
            progressRef.current = self.progress; // Update your 3D progress here
          },
        },
      });
      tl.to({}, { duration: 10 });

      // 1. Canvas Fade (happens early in the scroll)
      tl.fromTo(
        canvasWrapRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 2 },

        1.25,
      );
      // Canvas fad out and back in for rain-to-model switch
      tl.to(
        canvasWrapRef.current,
        { opacity: 0, onComplete: () => setShowRain(false) },
        5.5,
      );
      // Canvas fade back in for model reveal
      tl.to(
        canvasWrapRef.current,
        {
          opacity: 1,
          onReverseComplete: () => setShowRain(true),
          style: {
            filter: "blur(1px)",
          },
        },
        6,
      );

      // Model animation progress (maps to model flight path)
      tl.to(
        modelState.current,
        {
          animationProgress: 1,
          duration: 3.5,
        },
        6.5,
      );

      // 2. Text Blur In (Starts at 10% scroll)
      tl.fromTo(
        split.words,
        { filter: "blur(20px) brightness(0%)" },
        { filter: "blur(0px) brightness(100%)", stagger: 0.08, duration: 0.75 },
        0,
      );

      // Text Blur Out — hide from DOM after fade so it can't intercept pointer events
      tl.to(
        split.words,
        {
          filter: "blur(20px) brightness(0%)",
          opacity: 0,
          stagger: 0.08,
          duration: 0.75,
          onComplete: () => {
            if (titleRef.current) titleRef.current.style.display = "none";
          },
          onReverseComplete: () => {
            if (titleRef.current) titleRef.current.style.display = "";
          },
        },
        4,
      );



      // Attach DevTools to the master timeline
      // GSDevTools.create({ animation: tl });
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <div
      ref={sectionRef}
      className="relative h-screen w-full flex items-center justify-center overflow-hidden"
    >
      <div
        ref={canvasWrapRef}
        className="absolute inset-0 z-0"
        style={{ opacity: 0, filter: "blur(1px)" }}
      >
        <Canvas
          camera={{ position: [0, 0, 12], fov: 60 }}
          style={{ width: "100%", height: "100%" }}
          gl={{ alpha: true }}
          onCreated={({ scene }) => {
            scene.background = null;
          }}
        >
          {showRain ? (
            <>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1.2} />
              <CubeRain progressRef={progressRef} />
            </>
          ) : (
            <>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1.2} />
              <CubesModelScene
                modelState={modelState}
                onHover={setHoveredCube}
              />
            </>
          )}
        </Canvas>
      </div>

      {/* Tech label columns — fade in once model settles */}
      <div
        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-700 select-none"
        style={{ opacity: settled ? 1 : 0 }}
      >
        <TechList items={LEFT_LIST}  side="left"  hoveredCube={hoveredCube} settled={settled} />
        <TechList items={RIGHT_LIST} side="right" hoveredCube={hoveredCube} settled={settled} />
      </div>


      <p
        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 text-lg font-aldrich tracking-widest pointer-events-none select-none transition-opacity duration-700 text-neutral-700"
        style={{ opacity: settled ? 1 : 0 }}
      >
        Drag to explore
      </p>

      <div className="relative z-10 overflow-hidden px-8 py-4">
        <h2
          ref={titleRef}
          className="text-6xl font-semibold font-aldrich text-center"
        >
          Stack
        </h2>
      </div>
    </div>
  );
}
