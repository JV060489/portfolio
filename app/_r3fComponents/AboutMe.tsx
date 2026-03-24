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
import { useTheme } from "@/app/context/ThemeContext";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const AboutMeModelTyped = AboutMeModel as ForwardRefExoticComponent<
  ThreeElements["group"] & RefAttributes<THREE.Group>
>;

const FLOAT_AMPLITUDE = 0.08;
const FLOAT_SPEED = 0.8;

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
    const t = clock.getElapsedTime();
    groupRef.current.position.y =
      baseY + Math.sin(t * FLOAT_SPEED) * FLOAT_AMPLITUDE;
  });

  return (
    <group ref={groupRef} position={[0, baseY, 0]}>
      {children}
    </group>
  );
}

const CAMERA_POSITION: [number, number, number] = [3.598065155573723, 0.5462456123396201, 2.7901045951631516];
const CAMERA_TARGET: [number, number, number] = [1.0201418214891476, 0.11689688992812922, -0.7868081410860884];

// How much the camera shifts in world units per normalized mouse unit
const PARALLAX_STRENGTH = 0.4;
const PARALLAX_LERP = 0.06;

function ParallaxCamera({
  mouseRef,
}: {
  mouseRef: React.RefObject<{ x: number; y: number }>;
}) {
  const get = useThree((s) => s.get);
  const base = useRef(new THREE.Vector3(...CAMERA_POSITION));
  const target = useRef(new THREE.Vector3(...CAMERA_TARGET));

  useFrame(() => {
    const camera = get().camera;
    const mx = mouseRef.current?.x ?? 0;
    const my = mouseRef.current?.y ?? 0;

    // Orbit the camera around the target by rotating the offset vector
    const offset = base.current.clone().sub(target.current);
    const spherical = new THREE.Spherical().setFromVector3(offset);

    spherical.theta -= mx * PARALLAX_STRENGTH * 0.3;
    spherical.phi -= my * PARALLAX_STRENGTH * 0.15;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.5, Math.PI - 0.5);

    const desiredOffset = new THREE.Vector3().setFromSpherical(spherical);
    const desired = target.current.clone().add(desiredOffset);

    camera.position.x += (desired.x - camera.position.x) * PARALLAX_LERP;
    camera.position.y += (desired.y - camera.position.y) * PARALLAX_LERP;
    camera.position.z += (desired.z - camera.position.z) * PARALLAX_LERP;
    camera.lookAt(target.current);
  });

  return null;
}

function AboutMeModelScene({
  mouseRef,
}: {
  mouseRef: React.RefObject<{ x: number; y: number }>;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={CAMERA_POSITION} />
      <AboutMeLights mode="dark" />
      <FloatingModel baseY={-1}>
        <Instances scale={1}>
          <AboutMeModelTyped scale={1.2} position={[0, 0, -2]} />
        </Instances>
      </FloatingModel>
      <ParallaxCamera mouseRef={mouseRef} />
      {/* <CameraDebug /> */}
    </>
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
      target={CAMERA_TARGET}
    />
  );
}

// Radius (px) within which a char reacts to the cursor
const REPULSE_RADIUS = 80;
// Max displacement in px
const REPULSE_STRENGTH = 20;

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
          // Push away from cursor
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

const BIO_TEXT =
  "Final-year at IIT Madras by day, architect of the 3D web by night. I live in the \"Blender-to-Browser\" pipeline—specializing in shipping high-fidelity, interactive experiences that make the standard URL feel like a canvas.";

function MaskRevealText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const split = SplitText.create(containerRef.current, {
        type: "words",
      });

      gsap.fromTo(
        split.words,
        { filter: "blur(8px) brightness(30%)", willChange: "filter" },
        {
          filter: "blur(0px) brightness(100%)",
          ease: "none",
          stagger: 0.05,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            end: "bottom 65%",
            scrub: true,
          },
        },
      );

      return () => split.revert();
    },
    { scope: containerRef, dependencies: [] },
  );

  return (
    <p ref={containerRef} className={className}>
      {text}
    </p>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AboutMe({ shouldAnimate: _ = false }: { shouldAnimate?: boolean }) {
  useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={sectionRef}
      className="h-full flex flex-row items-stretch"
    >
      {/* Left: text */}
      <div className="flex flex-col justify-center px-20 gap-12 w-1/2">
        <RepulseText
          text="About Me"
          className="text-8xl font-semibold font-aldrich"
        />
        <MaskRevealText
          text={BIO_TEXT}
          className="text-xl leading-relaxed text-justify"
        />
      </div>

      {/* Right: 3D model */}
      <div
        className="w-1/2 h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Canvas camera={{ manual: true }}>
          <AboutMeModelScene mouseRef={mouseRef} />
        </Canvas>
      </div>
    </div>
  );
}

export default AboutMe;
