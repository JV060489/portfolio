"use client";


/**
 * PositionHelper — drop this into any Canvas to find the perfect position/rotation/scale
 * for a model. Uses TransformControls to drag in scene, OrbitControls for camera,
 * and a Leva panel to read + tweak exact values. Logs to console on demand.
 *
 * Usage:
 *   import PositionHelper from "./_r3fComponents/PositionHelper";
 *   // Inside your <Canvas>:
 *   <PositionHelper />
 *
 * OrbitControls are automatically disabled while you drag with TransformControls.
 */

import { useRef, useEffect, useState } from "react";
import { OrbitControls, TransformControls } from "@react-three/drei";
import { useControls, button } from "leva";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PositionHelperProps {
  /** Object to attach TransformControls to. If omitted, a visible axes helper is used. */
  children?: React.ReactNode;
}

function TargetMesh() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6b00" wireframe />
    </mesh>
  );
}

export default function PositionHelper({ children }: PositionHelperProps) {
  const orbitRef = useRef<any>(null);
  const transformRef = useRef<any>(null);
  const targetRef = useRef<THREE.Group>(null!);
  const [target, setTarget] = useState<THREE.Group | null>(null);

  const [{ mode, space, showGrid }, set] = useControls("Transform Controls", () => ({
    mode: {
      value: "translate" as "translate" | "rotate" | "scale",
      options: ["translate", "rotate", "scale"],
    },
    space: {
      value: "world" as "world" | "local",
      options: ["world", "local"],
    },
    showGrid: { value: true, label: "Show Grid" },
    "Reset Camera": button(() => {
      const orbit = orbitRef.current;
      if (!orbit) return;
      orbit.reset();
    }),
  }));

  const [posValues, setPos] = useControls(
    "Position / Rotation / Scale",
    () => ({
      position: { value: [0, 0, 0] as [number, number, number], step: 0.01 },
      rotation: { value: [0, 0, 0] as [number, number, number], step: 0.01 },
      scale: { value: [1, 1, 1] as [number, number, number], step: 0.01 },
      "Log to Console": button(() => {
        const t = targetRef.current;
        if (!t) return;
        const p = t.position;
        const r = t.rotation;
        const s = t.scale;
        console.group("%c[PositionHelper] Current Transform", "color:#ff6b00;font-weight:bold");
        console.log(`position: [${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}]`);
        console.log(`rotation: [${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}]`);
        console.log(`scale:    [${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)}]`);
        console.log("Copy-paste ready:");
        console.log(
          `position={[${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}]}\n` +
          `rotation={[${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}]}\n` +
          `scale={[${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)}]}`
        );
        console.groupEnd();
      }),
    })
  );

  // Expose the group to TransformControls after mount
  useEffect(() => {
    if (targetRef.current) setTarget(targetRef.current);
  }, []);

  // Sync leva → group when user types in the panel
  useEffect(() => {
    const t = targetRef.current;
    if (!t) return;
    t.position.set(...posValues.position);
    t.rotation.set(...posValues.rotation);
    t.scale.set(...posValues.scale);
  }, [posValues.position, posValues.rotation, posValues.scale]);

  // Sync group → leva while dragging with TransformControls
  useFrame(() => {
    const t = targetRef.current;
    if (!t) return;
    const p = t.position;
    const r = t.rotation;
    const s = t.scale;
    setPos({
      position: [
        parseFloat(p.x.toFixed(3)),
        parseFloat(p.y.toFixed(3)),
        parseFloat(p.z.toFixed(3)),
      ],
      rotation: [
        parseFloat(r.x.toFixed(3)),
        parseFloat(r.y.toFixed(3)),
        parseFloat(r.z.toFixed(3)),
      ],
      scale: [
        parseFloat(s.x.toFixed(3)),
        parseFloat(s.y.toFixed(3)),
        parseFloat(s.z.toFixed(3)),
      ],
    });
  });

  // Disable OrbitControls while TransformControls is being dragged
  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;

    const onDraggingChanged = (e: any) => {
      if (orbitRef.current) orbitRef.current.enabled = !e.value;
    };

    tc.addEventListener("dragging-changed", onDraggingChanged);
    return () => tc.removeEventListener("dragging-changed", onDraggingChanged);
  }, [target]); // re-run once TransformControls mounts with a valid target

  return (
    <>
      <OrbitControls ref={orbitRef} makeDefault enableZoom={false} />

      {target && (
        <TransformControls
          ref={transformRef}
          object={target}
          mode={mode}
          space={space}
        />
      )}

      {showGrid && <gridHelper args={[20, 20, "#444444", "#222222"]} />}
      <axesHelper args={[5]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      {/* The draggable target — swap children in for your actual model */}
      {children ? (
        <group ref={targetRef}>{children}</group>
      ) : (
        <group ref={targetRef}>
          <TargetMesh />
        </group>
      )}
    </>
  );
}
