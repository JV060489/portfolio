"use client";

import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CUBE_DEFS = [
  { meshes: ["React_1", "React_2"], colors: ["#ffffff", "#61DAFB"] },
  {
    meshes: ["Rig", "Rig_1", "Rig_2", "Rig_3"],
    colors: ["#ffffff", "#E77503", "#0E4FE7", "#656565"],
  },
  { meshes: ["Tailwind_1", "Tailwind_2"], colors: ["#ffffff", "#06B6D4"] },
  { meshes: ["CSS_1", "CSS_2"], colors: ["#ffffff", "#663399"] },
  { meshes: ["JS_1", "JS_2"], colors: ["#ffffff", "#F7DF1E"] },
  { meshes: ["Html", "Html_1"], colors: ["#ffffff", "#E34F26"] },
  { meshes: ["Typescript_1", "Typescript_2"], colors: ["#ffffff", "#3178C6"] },
  { meshes: ["ThreeJS_1", "ThreeJS_2"], colors: ["#ffffff", "#000000"] },
  { meshes: ["Gsap", "Gsap_1"], colors: ["#ffffff", "#0AE448"] },
  { meshes: ["Next_1", "Next_2"], colors: ["#ffffff", "#111111"] },
  { meshes: ["NodeJS_1", "NodeJS_2"], colors: ["#ffffff", "#5FA04E"] },
  { meshes: ["Postgres_1", "Postgres_2"], colors: ["#ffffff", "#4169E1"] },
  { meshes: ["Express_1", "Express_2"], colors: ["#ffffff", "#47848F"] },
  { meshes: ["Kubernetes_1", "Kubernetes_2"], colors: ["#ffffff", "#326CE5"] },
  { meshes: ["Electron_1", "Electron_2"], colors: ["#ffffff", "#47848F"] },
  { meshes: ["Git_1", "Git_2"], colors: ["#ffffff", "#F05032"] },
  { meshes: ["Docker_1", "Docker_2"], colors: ["#ffffff", "#2496ED"] },
  {
    meshes: ["AWS_1", "AWS_2", "AWS_3"],
    colors: ["#ffffff", "#000000", "#E77B0D"],
  },
  {
    meshes: ["Geo", "Geo_1", "Geo_2", "Geo_3"],
    colors: ["#ffffff", "#E77503", "#0E4FE7", "#656565"],
  },
  {
    meshes: ["SubstancePainter_1", "SubstancePainter_2"],
    colors: ["#ffffff", "#E70013"],
  },
  { meshes: ["WebGL", "WebGL_1"], colors: ["#ffffff", "#990000"] },
  {
    meshes: ["Modelling", "Modelling_1", "Modelling_2", "Modelling_3"],
    colors: ["#ffffff", "#E77503", "#0E4FE7", "#656565"],
  },
  { meshes: ["Pytorch_1", "Pytorch_2"], colors: ["#ffffff", "#EE4C2C"] },
  { meshes: ["Unity_1", "Unity_2"], colors: ["#ffffff", "#aaaaaa"] },
  { meshes: ["ComfyUI", "ComfyUI_1"], colors: ["#ffffff", "#E7DA00"] },
  {
    meshes: ["Python_1", "Python_2", "Python_3"],
    colors: ["#ffffff", "#3776AB", "#E7B628"],
  },
  {
    meshes: [
      "HuggingFace_1",
      "HuggingFace_2",
      "HuggingFace_3",
      "HuggingFace_4",
    ],
    colors: ["#ffffff", "#FFD21E", "#000000", "#E77336"],
  },
];

const COUNT = 40;
const SPREAD_X = 25;
const SPREAD_Z = 2;
const Y_TOP = 18;
const Y_BOTTOM = -18;
const TRAVEL = Y_TOP - Y_BOTTOM;

// Grid-based placement: divide X range into columns
const COLS = 10;
const ROWS = Math.ceil(COUNT / COLS);
const COL_WIDTH = SPREAD_X / COLS;

interface InstanceData {
  defIndex: number;
  x: number;
  z: number;
  // phase: 0–1, evenly spaced within each column so cubes never overlap
  phase: number;
  // all cubes in the same column share the same speed so relative spacing never changes
  speed: number;
  rotAxis: THREE.Vector3;
  rotTurns: number;
  scale: number;
}

// Seeded pseudo-random so values are deterministic across renders
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const INSTANCES: InstanceData[] = Array.from({ length: COUNT }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const rng = seededRng(i * 7919 + 1);

  // X: fixed within the column cell, small jitter but stays inside the cell
  const jitter = (rng() - 0.5) * COL_WIDTH * 0.5;
  const x = -SPREAD_X / 2 + (col + 0.5) * COL_WIDTH + jitter;

  // All cubes in the same column share the same speed (keyed by column index)
  const colRng = seededRng(col * 3571 + 13);
  const speed = 0.7 + colRng() * 0.8;

  // Phase: evenly distribute within the column so cubes are always 1/ROWS apart
  // This guarantees equal spacing that can never collapse regardless of speed
  const phase = row / ROWS;

  return {
    defIndex: i % CUBE_DEFS.length,
    x,
    z: (rng() - 0.5) * SPREAD_Z,
    phase,
    speed,
    rotAxis: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
    rotTurns: 1 + rng() * 3,
    scale: 0.5,
  };
});

function FallingCube({
  data,
  nodes,
  progressRef,
}: {
  data: InstanceData;
  nodes: Record<string, THREE.Mesh>;
  progressRef: { current: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const def = CUBE_DEFS[data.defIndex];
  const quat = useRef(new THREE.Quaternion());

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    const p = progressRef.current;

    // How far has this cube fallen: phase offsets the start, speed controls rate
    // cyclePos wraps 0→1, each full cycle = one top-to-bottom pass
    const cyclePos = (p * data.speed + data.phase) % 1;
    const y = Y_TOP - cyclePos * TRAVEL;

    // After rain window (p > 0.5): if cube is below screen, hide it permanently
    const rainDone = p > 0.5;
    if (rainDone && y < Y_BOTTOM + 2) {
      g.visible = false;
      return;
    }
    g.visible = true;

    g.position.y = y;

    // Rotation purely from scroll — full rotTurns per cycle
    const angle = cyclePos * data.rotTurns * Math.PI * 2;
    quat.current.setFromAxisAngle(data.rotAxis, angle);
    g.quaternion.copy(quat.current);
  });

  return (
    <group
      ref={groupRef}
      position={[data.x, Y_TOP - data.phase * TRAVEL, data.z]}
      scale={data.scale}
    >
      {def.meshes.map((meshName, i) => {
        const node = nodes[meshName];
        if (!node) return null;
        return (
          <mesh key={meshName} geometry={node.geometry} castShadow>
            <meshStandardMaterial
              color={def.colors[i]}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function CubeRain({
  progressRef,
}: {
  progressRef: { current: number };
}) {
  const { nodes } = useGLTF("/Cubes.glb") as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      {INSTANCES.map((data, i) => (
        <FallingCube
          key={i}
          data={data}
          nodes={nodes}
          progressRef={progressRef}
        />
      ))}
    </>
  );
}

useGLTF.preload("/Cubes.glb");
