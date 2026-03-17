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
    intensity: 1.5,
    position: [-0.39532587318296963, 4.240761534203897, 6.661478027013738],
    target: [0, 0, 0],
  },
  {
    type: "spot",
    color: "#f50000",
    intensity: 1,
    position: [-2.0162986436089443, 0.07099189515126514, 0.9040297222468745],
    target: [-2.0162986436089443, 0.07099189515126514, 0.9040297222468745],
    angle: 0.42359877559829884,
    penumbra: 0.5,
    decay: 2,
    distance: 0,
  },
  {
    type: "spot",
    color: "#f50000",
    intensity: 0.3999999999999999,
    position: [-1.99128415875788, -0.24128162198495878, 1.3568484010100408],
    target: [-1.99128415875788, -0.24128162198495878, 1.3568484010100408],
    angle: 0.41359877559829883,
    penumbra: 0.5,
    decay: 2,
    distance: 0,
  },
  {
    type: "spot",
    color: "#ffffff",
    intensity: 5.3,
    position: [-1.110069819279736, 1.513046717420887, -0.8061650752806884],
    target: [-1.110069819279736, 1.513046717420887, -0.8061650752806884],
    angle: 0.48359877559829884,
    penumbra: 0.5,
    decay: 2,
    distance: 0,
  },
  {
    type: "spot",
    color: "#ffffff",
    intensity: 2.9000000000000004,
    position: [1.1989308152292193, 1.5887346217495635, 1.2314189869428465],
    target: [1.1989308152292193, 1.5887346217495635, 1.2314189869428465],
    angle: 0.7035987755982989,
    penumbra: 0.5,
    decay: 1.4,
    distance: 0,
  },
  {
    type: "spot",
    color: "#f5d406",
    intensity: 1,
    position: [0.052454608510753564, 0.03400104526838288, 1.361246777541258],
    target: [0.052454608510753564, 0.03400104526838288, 1.361246777541258],
    angle: 0.5235987755982988,
    penumbra: 0.5,
    decay: 2,
    distance: 0,
  },
  {
    type: "spot",
    color: "#f5d406",
    intensity: 1,
    position: [-0.08055329413240764, 0, 1.8215852144587399],
    target: [-0.08055329413240764, 0, 1.8215852144587399],
    angle: 0.5235987755982988,
    penumbra: 0.5,
    decay: 2,
    distance: 0,
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
