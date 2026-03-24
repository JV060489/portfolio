"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ── Light config type (matches SceneLights format) ───────────────────────────

interface LightDef {
  type: "ambient" | "directional" | "point" | "spot";
  color: string;
  intensity: number;
  position?: [number, number, number];
  target?: [number, number, number];
  castShadow?: boolean;
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
}

// ── Dark mode preset ─────────────────────────────────────────────────────────

const DARK_LIGHTS: LightDef[] = [
  {
    type: "directional",
    color: "#7678ff",
    intensity: 3.1,
    position: [-0.39532587318296963, 4.240761534203897, 6.661478027013738],
    target: [0, 0, 0],
    castShadow: false,
  },
  {
    type: "spot",
    color: "#ffffff",
    intensity: 5.3,
    position: [-0.7671083066052744, 0.3196181280457835, -2.578884410419651],
    target: [-0.7671083066052744, 0.3196181280457835, -2.578884410419651],
    angle: 0.48359877559829884,
    penumbra: 0.5,
    distance: 0,
    decay: 2,
    castShadow: false,
  },
  {
    type: "spot",
    color: "#ffffff",
    intensity: 2.9000000000000004,
    position: [0.8832612099250288, 0.4821050381579687, -1.004339419849075],
    target: [0.7952006617587841, 0.48223780963043195, -0.95282005476456],
    angle: 0.7035987755982989,
    penumbra: 0.5,
    distance: 0,
    decay: 1.4,
    castShadow: false,
  },
];

// ── Light mode preset ────────────────────────────────────────────────────────

const LIGHT_LIGHTS: LightDef[] = [
  {
    type: "ambient",
    color: "#ffffff",
    intensity: 0.5,
  },
  {
    type: "directional",
    color: "#ffffff",
    intensity: 1,
    position: [5, 10, 7.5],
    target: [0, 0, 0],
  },
];

// ── Targeted light — mirrors SceneLights group+target pattern ────────────────

function TargetedLight({ def }: { def: LightDef }) {
  const lightRef = useRef<THREE.SpotLight | THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  const pos = def.position ?? [0, 0, 0];
  const t = def.target ?? [0, 0, 0];

  // Assign the target object to the light once both are mounted
  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  });

  if (def.type === "directional") {
    return (
      <group>
        <object3D ref={targetRef} position={[t[0], t[1], t[2]]} />
        <group position={[pos[0], pos[1], pos[2]]}>
          <directionalLight
            ref={lightRef as React.RefObject<THREE.DirectionalLight>}
            color={def.color}
            intensity={def.intensity}
            castShadow={def.castShadow ?? false}
          />
        </group>
      </group>
    );
  }

  return (
    <group>
      <object3D ref={targetRef} position={[t[0], t[1], t[2]]} />
      <group position={[pos[0], pos[1], pos[2]]}>
        <spotLight
          ref={lightRef as React.RefObject<THREE.SpotLight>}
          color={def.color}
          intensity={def.intensity}
          angle={def.angle}
          penumbra={def.penumbra}
          distance={def.distance}
          decay={def.decay}
          castShadow={def.castShadow ?? false}
        />
      </group>
    </group>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface AboutMeLightsProps {
  mode: "dark" | "light";
}

export default function AboutMeLights({ mode }: AboutMeLightsProps) {
  const preset = mode === "dark" ? DARK_LIGHTS : LIGHT_LIGHTS;

  return (
    <>
      {preset.map((def, i) => {
        if (def.type === "ambient") {
          return (
            <ambientLight
              key={i}
              color={def.color}
              intensity={def.intensity}
            />
          );
        }
        if (def.type === "point") {
          return (
            <group key={i} position={def.position}>
              <pointLight
                color={def.color}
                intensity={def.intensity}
                distance={def.distance}
                decay={def.decay}
                castShadow={def.castShadow ?? false}
              />
            </group>
          );
        }
        return <TargetedLight key={i} def={def} />;
      })}
    </>
  );
}
