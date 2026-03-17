"use client";

import {
  useRef,
  useEffect,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { AboutMeModel, Instances } from "@/public/AboutMeModel.jsx";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeElements,
} from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Text,
} from "@react-three/drei";
import { button, useControls } from "leva";
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

const FLOAT_AMPLITUDE = 0.1;
const FLOAT_SPEED = 1;

function FloatingModel({
  children,
  baseY = -1,
}: {
  children: React.ReactNode;
  baseY?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      baseY + Math.sin(clock.getElapsedTime() * FLOAT_SPEED) * FLOAT_AMPLITUDE;
  });

  return (
    <group ref={groupRef} position={[0, baseY, 0]}>
      {children}
    </group>
  );
}


const CAMERA_STORAGE_KEY = "aboutme-camera-setup";

// Plain object to hold controls ref — avoids React compiler ref-in-render lint
const cameraDebugState: {
  controls: React.ComponentRef<typeof OrbitControls> | null;
} = {
  controls: null,
};

function CameraDebug() {
  const { camera } = useThree();
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  useEffect(() => {
    cameraDebugState.controls = controlsRef.current;
    return () => {
      cameraDebugState.controls = null;
    };
  });

  useControls("Camera", {
    "Save Camera": button(() => {
      const target = cameraDebugState.controls?.target;
      const data = {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [target?.x ?? 0, target?.y ?? 0, target?.z ?? 0],
      };
      localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(data));
      console.log("Camera saved:", data);
    }),
    "Load Camera": button(() => {
      const raw = localStorage.getItem(CAMERA_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      console.log("Camera loaded:", data);
    }),
    "Log Current": button(() => {
      const target = cameraDebugState.controls?.target;
      console.log("Position:", [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ]);
      console.log("Target:", [target?.x ?? 0, target?.y ?? 0, target?.z ?? 0]);
    }),
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableZoom={false}
      target={[0.03, 1.01, -0.34]}
    />
  );
}

function AboutMeScene({
  theme,
}: {
  theme: "dark" | "light";
}) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[
          -0.07542700310537993, 0.8182533429761684, 7.0903515877460865,
        ]}
      />
      {DEV_LIGHTS ? <SceneLights /> : <AboutMeLights mode={theme} />}
      <FloatingModel baseY={-1}>
        <Instances scale={1}>
          <AboutMeModelTyped scale={1.6} position={[0, 0, -2]} />
        </Instances>
      </FloatingModel>
      <Text
        font="/fonts/Ephesis-Regular.ttf"
        fontSize={6}
        anchorX="center"
        anchorY="middle"
        position={[0, 5, -15]}
        color={theme === "dark" ? "#666666" : "#dddddd"}
      >
        About Me
      </Text>
      {/* <CameraDebug /> */}
    </>
  );
}

interface AboutMeProps {
  shouldAnimate?: boolean;
}

function AboutMe({ shouldAnimate = false }: AboutMeProps) {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

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
      <div className="flex w-full h-screen ">
        {/* Left Section: 50% width */}
        <div className="w-screen h-full">
          <Canvas>
            <AboutMeScene theme={theme} />
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
