"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useFrame, ThreeEvent } from "@react-three/fiber";

// ── Sticker colours (standard WCA scheme) ────────────────────────────────────
const STICKER = {
  R: "#0045AD", // right  +X → blue
  L: "#009B48", // left   -X → green
  U: "#FFFFFF", // up     +Y → white
  D: "#FFD500", // down   -Y → yellow
  F: "#B71234", // front  +Z → red
  B: "#FF5800", // back   -Z → orange
  I: "#111111", // inner (not visible)
};

const GAP = 1.05; // spacing between cubies
const SZ = 0.95; // size of each cubie

// ── Cubie type ────────────────────────────────────────────────────────────────
type CubieState = {
  id: number;
  /** logical grid position (each coord is -1 | 0 | 1) */
  lx: number;
  ly: number;
  lz: number;
  /** world position */
  px: number;
  py: number;
  pz: number;
  /** world quaternion */
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  /** face colours – BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z */
  colors: [string, string, string, string, string, string];
};

function buildCubies(): CubieState[] {
  const out: CubieState[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        out.push({
          id: id++,
          lx: x,
          ly: y,
          lz: z,
          px: x * GAP,
          py: y * GAP,
          pz: z * GAP,
          qx: 0,
          qy: 0,
          qz: 0,
          qw: 1,
          colors: [
            x === 1 ? STICKER.R : STICKER.I,
            x === -1 ? STICKER.L : STICKER.I,
            y === 1 ? STICKER.U : STICKER.I,
            y === -1 ? STICKER.D : STICKER.I,
            z === 1 ? STICKER.F : STICKER.I,
            z === -1 ? STICKER.B : STICKER.I,
          ],
        });
      }
    }
  }
  return out;
}

// ── helpers ───────────────────────────────────────────────────────────────────
/** Round a number to the nearest half-step (0, ±GAP). */
function snapToGrid(v: number) {
  return Math.round(v / GAP) * GAP;
}
function snapLogical(v: number) {
  return Math.round(v / GAP) as -1 | 0 | 1;
}

/**
 * Camera-aware rotation resolver.
 *
 * Instead of hardcoded screen-space signs (which break after orbiting), we:
 *  1. Extract the camera's world-space right/up vectors.
 *  2. Build the drag direction in world space.
 *  3. Project it onto the face plane (remove the component along the face normal).
 *  4. Cross faceNormal × dragOnFace → rotation axis that moves the face in the drag direction.
 *  5. Snap to nearest signed world axis (X/Y/Z) and return angle = +π/2.
 */
function resolveRotation(
  faceNormal: THREE.Vector3,
  cubie: CubieState,
  dx: number,
  dy: number,
  camera: THREE.Camera,
): {
  rotAxis: THREE.Vector3;
  layerKey: "lx" | "ly" | "lz";
  layerVal: number;
  angle: number;
} | null {
  // Camera's world-space orientation columns
  const camRight = new THREE.Vector3().setFromMatrixColumn(
    camera.matrixWorld,
    0,
  );
  const camUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);

  // World-space drag direction
  // Screen +dy = down, world +Y = up → negate dy
  const dragWorld = new THREE.Vector3()
    .addScaledVector(camRight, dx)
    .addScaledVector(camUp, -dy)
    .normalize();

  // Project onto the face plane so the vector lies ON the face
  const dragOnFace = dragWorld
    .clone()
    .addScaledVector(faceNormal, -dragWorld.dot(faceNormal))
    .normalize();

  // Degenerate: drag direction is nearly parallel to face normal (poke, not swipe)
  if (!isFinite(dragOnFace.x) || dragOnFace.lengthSq() < 0.01) return null;

  // Rotation axis — right-hand rule: rotating around this axis moves the face sticker
  // in the drag direction
  const rawAxis = new THREE.Vector3().crossVectors(faceNormal, dragOnFace);

  // Snap to the nearest signed world axis
  const ax = Math.abs(rawAxis.x);
  const ay = Math.abs(rawAxis.y);
  const az = Math.abs(rawAxis.z);

  let rotAxis: THREE.Vector3;
  let layerKey: "lx" | "ly" | "lz";
  let layerVal: number;

  if (ax >= ay && ax >= az) {
    rotAxis = new THREE.Vector3(Math.sign(rawAxis.x), 0, 0);
    layerKey = "lx";
    layerVal = cubie.lx;
  } else if (ay >= ax && ay >= az) {
    rotAxis = new THREE.Vector3(0, Math.sign(rawAxis.y), 0);
    layerKey = "ly";
    layerVal = cubie.ly;
  } else {
    rotAxis = new THREE.Vector3(0, 0, Math.sign(rawAxis.z));
    layerKey = "lz";
    layerVal = cubie.lz;
  }

  // Angle is always +π/2; direction is already encoded in the signed rotAxis
  return { rotAxis, layerKey, layerVal, angle: Math.PI / 2 };
}

// ── Single cubie mesh ─────────────────────────────────────────────────────────
type CubieProps = {
  cubie: CubieState;
  onPointerDown: (e: ThreeEvent<PointerEvent>, cubie: CubieState) => void;
  onMeshRef: (id: number, mesh: THREE.Mesh | null) => void;
};

const Cubie = React.memo(function Cubie({
  cubie,
  onPointerDown,
  onMeshRef,
}: CubieProps) {
  return (
    <mesh
      ref={(m) => onMeshRef(cubie.id, m)}
      position={[cubie.px, cubie.py, cubie.pz]}
      quaternion={
        [cubie.qx, cubie.qy, cubie.qz, cubie.qw] as [
          number,
          number,
          number,
          number,
        ]
      }
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onPointerDown(e, cubie);
      }}
    >
      <boxGeometry args={[SZ, SZ, SZ]} />
      {cubie.colors.map((col, i) => (
        <meshStandardMaterial
          key={i}
          attach={`material-${i}`}
          color={col}
          roughness={0.25}
          metalness={0.05}
        />
      ))}
    </mesh>
  );
});

// ── Main Rubik's-cube component ───────────────────────────────────────────────
export default function RubiksCubeMain({
  setHovered,
}: {
  setHovered: (h: boolean) => void;
}) {
  const [cubies, setCubies] = useState<CubieState[]>(() => buildCubies());

  // Mirror cubies into a ref so useFrame can read current positions without
  // stale closures and without triggering re-renders.
  const cubiesRef = useRef(cubies);
  useEffect(() => {
    cubiesRef.current = cubies;
  }, [cubies]);

  // Direct Three.js mesh refs — keyed by cubie id.
  // We animate by mutating these objects directly, so cubies never
  // unmount/remount mid-animation → eliminates the flash.
  const meshRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const onMeshRef = useCallback((id: number, mesh: THREE.Mesh | null) => {
    if (mesh) meshRefs.current.set(id, mesh);
    else meshRefs.current.delete(id);
  }, []);

  // Animation state ───────────────────────────────────────────────────────────
  type RotationJob = {
    ids: number[];
    axis: THREE.Vector3;
    targetAngle: number;
    /** snapshot of each rotating cubie's pose at animation start */
    startPoses: Map<number, { pos: THREE.Vector3; quat: THREE.Quaternion }>;
  };

  const jobRef = useRef<RotationJob | null>(null);
  const animating = useRef(false);
  const animStartRef = useRef<number>(-1);
  const ANIM_DURATION = 600;

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Commit: bake final transforms into React state.
  // jobRef is cleared FIRST so useFrame stops mutating meshes before setState.
  const commitRotation = useCallback((job: RotationJob) => {
    jobRef.current = null;
    animating.current = false;

    const rotMat = new THREE.Matrix4().makeRotationAxis(
      job.axis.clone().normalize(),
      job.targetAngle,
    );

    setCubies((prev) =>
      prev.map((c) => {
        if (!job.ids.includes(c.id)) return c;
        const pose = job.startPoses.get(c.id)!;
        const curMatrix = new THREE.Matrix4().compose(
          pose.pos,
          pose.quat,
          new THREE.Vector3(1, 1, 1),
        );
        const newMatrix = rotMat.clone().multiply(curMatrix);
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        const scl = new THREE.Vector3();
        newMatrix.decompose(pos, quat, scl);
        quat.normalize();
        return {
          ...c,
          px: snapToGrid(pos.x),
          py: snapToGrid(pos.y),
          pz: snapToGrid(pos.z),
          lx: snapLogical(pos.x),
          ly: snapLogical(pos.y),
          lz: snapLogical(pos.z),
          qx: quat.x,
          qy: quat.y,
          qz: quat.z,
          qw: quat.w,
        };
      }),
    );
  }, []);

  // Drive animation directly on Three.js mesh objects — no React state changes
  // mid-flight, so no unmount/remount, no flash.
  useFrame(() => {
    const job = jobRef.current;
    if (!job || animStartRef.current < 0) return;

    const elapsed = performance.now() - animStartRef.current;
    const raw = Math.min(elapsed / ANIM_DURATION, 1);
    const eased = easeOutCubic(raw);

    const rotQ = new THREE.Quaternion().setFromAxisAngle(
      job.axis,
      job.targetAngle * eased,
    );
    const rotM = new THREE.Matrix4().makeRotationFromQuaternion(rotQ);

    for (const id of job.ids) {
      const mesh = meshRefs.current.get(id);
      const pose = job.startPoses.get(id);
      if (!mesh || !pose) continue;

      // Rotate the start position around the slice axis
      mesh.position.copy(pose.pos.clone().applyMatrix4(rotM));
      // Compose: world rotation × local quaternion
      mesh.quaternion.copy(rotQ.clone().multiply(pose.quat));
    }

    if (raw >= 1) {
      animStartRef.current = -1;
      commitRotation(job);
    }
  });

  // Kick off a rotation ───────────────────────────────────────────────────────
  const startRotation = useCallback(
    (resolution: ReturnType<typeof resolveRotation>) => {
      if (!resolution || animating.current) return;

      const current = cubiesRef.current;
      const layerCubies = current.filter((c) => {
        if (resolution.layerKey === "lx") return c.lx === resolution.layerVal;
        if (resolution.layerKey === "ly") return c.ly === resolution.layerVal;
        return c.lz === resolution.layerVal;
      });

      // Snapshot start poses now (before any mutation)
      const startPoses = new Map<
        number,
        { pos: THREE.Vector3; quat: THREE.Quaternion }
      >();
      for (const c of layerCubies) {
        startPoses.set(c.id, {
          pos: new THREE.Vector3(c.px, c.py, c.pz),
          quat: new THREE.Quaternion(c.qx, c.qy, c.qz, c.qw),
        });
      }

      jobRef.current = {
        ids: layerCubies.map((c) => c.id),
        axis: resolution.rotAxis,
        targetAngle: resolution.angle,
        startPoses,
      };
      animating.current = true;
      animStartRef.current = performance.now();
    },
    [],
  );

  // Drag tracking ─────────────────────────────────────────────────────────────
  type DragStart = {
    cubie: CubieState;
    worldNormal: THREE.Vector3;
    camera: THREE.Camera; // captured at pointer-down so orbit can't change it mid-drag
    sx: number;
    sy: number;
  };
  const dragRef = useRef<DragStart | null>(null);
  const draggingFromCube = useRef(false);
  // True when the current pointer-down started on empty canvas (outside the cube).
  // Prevents onPointerEnter from locking out OrbitControls mid-orbit-drag.
  const outsideDragActive = useRef(false);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>, cubie: CubieState) => {
      if (animating.current) return;

      const localNormal: THREE.Vector3 =
        e.face?.normal?.clone() ?? new THREE.Vector3(0, 0, 1);

      const mesh = e.object as THREE.Mesh;
      if (mesh) {
        const wq = new THREE.Quaternion();
        mesh.getWorldQuaternion(wq);
        localNormal.applyQuaternion(wq);
      }

      draggingFromCube.current = true;
      dragRef.current = {
        cubie,
        worldNormal: localNormal,
        camera: e.camera, // snapshot — immune to further orbit
        sx: e.clientX,
        sy: e.clientY,
      };
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      draggingFromCube.current = false;
      outsideDragActive.current = false;
      setHovered(false);

      if (!dragRef.current || animating.current) {
        dragRef.current = null;
        return;
      }
      const { cubie, worldNormal, camera, sx, sy } = dragRef.current;
      dragRef.current = null;

      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.sqrt(dx * dx + dy * dy) < 8) return;

      // Camera-aware: correct direction regardless of orbit angle
      const resolution = resolveRotation(worldNormal, cubie, dx, dy, camera);
      startRotation(resolution);
    },
    [startRotation, setHovered],
  );

  // Window pointerdown fires AFTER R3F's canvas handler (bubble order: element → window),
  // so draggingFromCube is already set when this runs.
  // If nothing on the cube was hit, this is an outside/orbit drag — mark it.
  const handleWindowPointerDown = useCallback(() => {
    if (!draggingFromCube.current) {
      outsideDragActive.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("pointerdown", handleWindowPointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handleWindowPointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handleWindowPointerDown, handlePointerUp]);

  return (
    <group
      onPointerEnter={() => {
        // Don't lock out OrbitControls if the drag started outside the cube
        if (!outsideDragActive.current) setHovered(true);
      }}
      onPointerLeave={() => {
        if (!draggingFromCube.current) setHovered(false);
      }}
    >
      

      {/* All 27 cubies always in one flat list — no unmount/remount during animation */}
      {cubies.map((c) => (
        <Cubie
          key={c.id}
          cubie={c}
          onPointerDown={handlePointerDown}
          onMeshRef={onMeshRef}
        />
      ))}
    </group>
  );
}
