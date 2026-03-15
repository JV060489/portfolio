"use client";

import {
  useRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { AboutMeModel, Instances } from "@/public/AboutMeModel.jsx";
import { Canvas, type ThreeElements } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import AboutMeLights from "./AboutMeLights";
import SceneLights from "./SceneLights";
import { useTheme } from "@/app/context/ThemeContext";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const AboutMeModelTyped = AboutMeModel as ForwardRefExoticComponent<
  ThreeElements["group"] & RefAttributes<THREE.Group>
>;

// const DEV_LIGHTS = process.env.NODE_ENV === "development";
const DEV_LIGHTS = false;

interface AboutMeProps {
  shouldAnimate?: boolean;
}

function AboutMe({ shouldAnimate = false }: AboutMeProps) {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sceneGroupRef = useRef<THREE.Group>(null);

  useGSAP(
    () => {
      if (!shouldAnimate) return;
      let split: ReturnType<typeof SplitText.create> | null = null;
      let tween: gsap.core.Tween | null = null;

      if (textRef.current) {
        split = SplitText.create(textRef.current, {
          // Split by words+chars so visual spacing stays intact while animating chars.
          type: "words,chars",
        });
      }

      if (split && textRef.current) {
        tween = gsap.fromTo(
          split.chars,
          {
            filter: "blur(10px) brightness(30%)",
            willChange: "filter",
          },
          {
            ease: "none",
            filter: "blur(0px) brightness(100%)",
            stagger: 0.05,
            scrollTrigger: {
              trigger: textRef.current,
              start: "top bottom-=20%",
              end: "bottom center+=80%",
              scrub: true,
            },
          },
        );
      }
      return () => {
        tween?.scrollTrigger?.kill();
        tween?.kill();
        split?.revert();
      };
    },
    {
      scope: sectionRef,
      dependencies: [shouldAnimate],
      revertOnUpdate: true,
    },
  );

  return (
    <div ref={sectionRef}>
      {/* <h2
        ref={titleRef}
        className="text-6xl px-30 pt-40 pb-20"
        style={{
          fontFamily: "var(--font-aldrich)",
        }}
      >
        About Me
      </h2> */}
      {/* 3D Model Canvas */}
      <div className="flex w-full h-screen">
        {/* Left Section: 50% width */}
        <div className="w-screen h-160">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 2, 8]} />
            <group ref={sceneGroupRef}>
              {DEV_LIGHTS ? <SceneLights /> : <AboutMeLights mode={theme} />}
              <Instances scale={1}>
                <AboutMeModelTyped
                  scale={1.6}
                  position={[0, -1, 0]}
                />
              </Instances>
              <Text
                font="/fonts/Ephesis-Regular.ttf"
                fontSize={6}
                anchorX="center"
                anchorY="middle"
                position={[0, 5, -10]}
                color={theme === "dark" ? "#666666" : "#dddddd"}
              >
                About Me
              </Text>
            </group>
            <OrbitControls makeDefault enableZoom={false} />
          </Canvas>
        </div>

        {/* Right Section: 50% width */}
        {/* <p
          ref={textRef}
          className="basis-1/2 text-xl p-20 leading-relaxed pb-100"
          id="about"
        >
          Final-year at IIT Madras by day, architect of the 3D web by night. I
          live in the &quot;Blender-to-Browser&quot; pipeline—specializing in
          shipping high-fidelity, interactive experiences that make the standard
          URL feel like a canvas. I’m obsessed with the technical craft required
          to bridge the gap between complex 3D assets and seamless web
          performance. When I’m not optimizing textures or engineering
          interactions, I’m usually deep-diving into complex logic puzzles or
          practicing Japanese (日本語を勉強しています). I’m driven by the
          &ldquo;Aha!&quot; moment—whether that’s solving a difficult piece of
          code or a literal puzzle. I build for the web’s 3D future, one
          high-fidelity product at a time.
        </p> */}
      </div>
    </div>
  );
}

export default AboutMe;
