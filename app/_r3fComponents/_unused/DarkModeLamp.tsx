"use client";

import { useRef } from "react";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import { EffectComposer, Bloom, GodRays } from "@react-three/postprocessing";

interface DarkModeLampProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function DarkModeLamp({ isDark, onToggle }: DarkModeLampProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Spring entry: lamp drops in from above with natural oscillation
  const { posY } = useSpring({
    from: { posY: 2 },
    to: { posY: 0.5 },
    config: { mass: 2.2, tension: 180, friction: 14 },
  });

  const metalGray: THREE.MeshStandardMaterialParameters = {
    color: "#808080",
    metalness: 0.9,
    roughness: 0.25,
  };

  const capMetal: THREE.MeshStandardMaterialParameters = {
    color: "#6e6e6e",
    metalness: 0.85,
    roughness: 0.3,
  };

  const shadeMetal: THREE.MeshStandardMaterialParameters = {
    color: "#9aafb8",
    metalness: 0.6,
    roughness: 0.35,
    side: THREE.DoubleSide,
  };

  const rimMetal: THREE.MeshStandardMaterialParameters = {
    color: "#7a8f96",
    metalness: 0.7,
    roughness: 0.3,
  };
  return (
    <>
      <animated.group
        ref={groupRef}
        position-y={posY}
        onClick={onToggle}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        {/* ── Invisible click target covering the whole lamp ──── */}
        <mesh position={[0, 0.5, 0]} visible={false}>
          <cylinderGeometry args={[0.75, 0.75, 3, 16]} />
          <meshBasicMaterial />
        </mesh>

        {/* ── Hanging rod ─────────────────────────────────────── */}
        <mesh position={[0, 1.55, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 2.2, 8]} />
          <meshStandardMaterial {...metalGray} />
        </mesh>

        {/* ── Cap / canopy (where rod meets shade) ─────────────── */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
          <meshStandardMaterial {...capMetal} />
        </mesh>

        {/* ── Shade (truncated cone, open-ended) ───────────────── */}
        {/* CylinderGeometry: topRadius, bottomRadius, height, radialSegs, heightSegs, openEnded */}
        <mesh position={[0, 0.0, 0]}>
          <cylinderGeometry args={[0.12, 0.72, 0.52, 32, 1, true]} />
          <meshStandardMaterial {...shadeMetal} />
        </mesh>

        {/* ── Shade bottom rim (torus) ─────────────────────────── */}
        <mesh position={[0, -0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.72, 0.012, 8, 48]} />
          <meshStandardMaterial {...rimMetal} />
        </mesh>

        {/* ── Bulb — sits inside the shade ─────────────────────── */}
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.20, 32, 32]} />
          <meshStandardMaterial
            color={isDark ? "#ffffff" : "#c8c8c8"}
            emissive={isDark ? "#fffef0" : "#000000"}
            emissiveIntensity={isDark ? 1.8 : 0}
            transparent
            opacity={0.95}
            roughness={0.05}
            metalness={0}
          />
        </mesh>

        {/* ── Visible light-beam cone pointing downward ────────── */}

        {/* ── Point light emitted by bulb ───────────────────────── */}
        <pointLight
          position={[0, -0.3, 0]}
          color="#fffee0"
          intensity={isDark ? 3.5 : 0}
          distance={10}
          decay={2}
        />
      </animated.group>

      {/* ── Soft halo bloom around the bulb ──────────────────── */}
      {isDark && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.6}
            luminanceSmoothing={5}
            intensity={3}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}
