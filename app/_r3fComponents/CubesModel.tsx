import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import type { AnimationState } from "./StackSection";

interface Props {
  modelState: React.RefObject<AnimationState>;
  onHover?: (name: string | null) => void;
}

// Three keyframe positions found with PositionHelper
const DEG = Math.PI / 180;
const START  = { x: 15.224, y:  8.450, z: 0.000, rx:   0 * DEG, ry:   0 * DEG, rz:   0 * DEG };
const MIDDLE = { x: -0.213, y: -1.764, z: 5.031, rx:  29 * DEG, ry:  180 * DEG, rz:  -4 * DEG };
const END    = { x:  0.000, y:  0.000, z: 2.000, rx:  30 * DEG, ry: 320 * DEG, rz:   0 * DEG };

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOut(t: number) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }


// Shared ref to track which cube is currently hovered (by name)
// We use a module-level ref so all HoverCube instances share state
let activeHoverName: string | null = null;

interface HoverCubeProps {
  name: string;
  children: React.ReactNode;
  onHover?: (name: string | null) => void;
}

interface ScaleEntry {
  mesh: THREE.Mesh;
  originalColor: THREE.Color;
}

function HoverCube({ name, children, onHover }: HoverCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const t = useRef(0);
  const entries = useRef<ScaleEntry[]>([]);

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    const meshes: THREE.Mesh[] = [];
    g.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
    });
    entries.current = meshes
      .filter((_, i) => i !== 0) // skip white cube shell
      .map((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        return { mesh, originalColor: mat.color.clone() };
      });
  }, []);

  useFrame((_, delta) => {
    const target = hovered ? 1 : 0;
    t.current = THREE.MathUtils.damp(t.current, target, 7, delta);
    const tv = t.current;
    const scale = THREE.MathUtils.lerp(1.0, 1.06, tv);
    entries.current.forEach(({ mesh, originalColor }) => {
      mesh.scale.setScalar(scale);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive.copy(originalColor);
      mat.emissiveIntensity = tv * 0.2;
    });
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (activeHoverName !== name) {
          activeHoverName = name;
          setHovered(true);
          onHover?.(name);
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (activeHoverName === name) {
          activeHoverName = null;
          setHovered(false);
          onHover?.(null);
        }
      }}
    >
      {children}
    </group>
  );
}

export default function CubesModelScene({ modelState, onHover }: Props) {
  const group = useRef<THREE.Group>(null);
  const settledRef = useRef(false);

  // Current displayed rotation (smoothly follows target)
  const currentRot = useRef({ x: END.rx, y: END.ry });
  // Target rotation accumulates drag on top of END
  const targetRot = useRef({ x: END.rx, y: END.ry });
  // Velocity for inertia after pointer release
  const velocity = useRef({ x: 0, y: 0 });

  const resetting = useRef(false);
  // Snapshot of rotation when reset starts, for tween from-position
  const resetFrom = useRef({ x: END.rx, y: END.ry });
  const resetProgress = useRef(0); // 0→1 over RESET_DURATION
  const RESET_DURATION = 1; // seconds
  const draggingRef = useRef(false);

  const { gl } = useThree();

  const { nodes, animations } = useGLTF("/Cubes.glb") as unknown as {
    nodes: Record<string, THREE.Mesh>;
    animations: THREE.AnimationClip[];
  };
  useAnimations(animations, group);

  // Pointer drag handlers — only active when settled
  useEffect(() => {
    const canvas = gl.domElement;
    let lastX = 0;
    let lastY = 0;
    let prevDx = 0;
    let prevDy = 0;

    const onDown = (e: PointerEvent) => {
      if (!settledRef.current) return;
      draggingRef.current = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velocity.current = { x: 0, y: 0 };
      resetting.current = false;
    };

    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      prevDx = e.clientX - lastX;
      prevDy = e.clientY - lastY;
      targetRot.current.y += prevDx * 0.008;
      targetRot.current.x += prevDy * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      velocity.current = { x: prevDy * 0.008, y: prevDx * 0.008 };
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    const p = modelState.current?.animationProgress ?? 0;

    if (p >= 0.99) {
      if (!settledRef.current) settledRef.current = true;

      // Apply inertia: velocity decays each frame
      if (!draggingRef.current) {
        velocity.current.x *= 0.92;
        velocity.current.y *= 0.92;
        targetRot.current.x += velocity.current.x;
        targetRot.current.y += velocity.current.y;
      }

      // Smooth follow: currentRot lerps toward targetRot
      currentRot.current.x = lerp(currentRot.current.x, targetRot.current.x, 0.1);
      currentRot.current.y = lerp(currentRot.current.y, targetRot.current.y, 0.1);

      g.position.set(END.x, END.y, END.z);
      g.rotation.set(currentRot.current.x, currentRot.current.y, END.rz);
      return;
    }

    // Scrolled back — tween from current rotation back to END over RESET_DURATION
    if (settledRef.current) {
      settledRef.current = false;
      velocity.current = { x: 0, y: 0 };
      resetting.current = true;
      resetProgress.current = 0;
      resetFrom.current = { x: currentRot.current.x, y: currentRot.current.y };
    }

    if (resetting.current) {
      resetProgress.current = Math.min(resetProgress.current + delta / RESET_DURATION, 1);
      const t = easeInOut(resetProgress.current);
      currentRot.current.x = lerp(resetFrom.current.x, END.rx, t);
      currentRot.current.y = lerp(resetFrom.current.y, END.ry, t);
      targetRot.current.x = currentRot.current.x;
      targetRot.current.y = currentRot.current.y;
      if (resetProgress.current >= 1) {
        currentRot.current = { x: END.rx, y: END.ry };
        targetRot.current = { x: END.rx, y: END.ry };
        resetting.current = false;
      }
    }

    // Phase 1: 0→0.5 = START → MIDDLE, Phase 2: 0.5→1 = MIDDLE → END
    let px: number, py: number, pz: number, prx: number, pry: number, prz: number;

    if (p <= 0.5) {
      const t = easeInOut(p / 0.5);
      px  = lerp(START.x,  MIDDLE.x,  t);
      py  = lerp(START.y,  MIDDLE.y,  t);
      pz  = lerp(START.z,  MIDDLE.z,  t);
      prx = lerp(START.rx, MIDDLE.rx, t);
      pry = lerp(START.ry, MIDDLE.ry, t);
      prz = lerp(START.rz, MIDDLE.rz, t);
    } else {
      const t = easeInOut((p - 0.5) / 0.5);
      px  = lerp(MIDDLE.x,  END.x,  t);
      py  = lerp(MIDDLE.y,  END.y,  t);
      pz  = lerp(MIDDLE.z,  END.z,  t);
      prx = lerp(MIDDLE.rx, END.rx, t);
      pry = lerp(MIDDLE.ry, END.ry, t);
      prz = lerp(MIDDLE.rz, END.rz, t);
    }

    g.position.set(px, py, pz);
    g.rotation.set(prx, pry, prz);
  });

  return (
    <>
    <group ref={group} position={[START.x, START.y, START.z]} scale={0.45}>
      {/* Shell layer */}
      <HoverCube onHover={onHover} name="React">
        <group position={[0, 4.2, 0]}>
          <mesh geometry={nodes.React_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.React_2.geometry}>
            <meshStandardMaterial color="#61DAFB" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Blender(Rig)">
        <group position={[2.1, 4.2, 0]}>
          <mesh geometry={nodes.Rig.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Rig_1.geometry}>
            <meshStandardMaterial color="#E77503" />
          </mesh>
          <mesh geometry={nodes.Rig_2.geometry}>
            <meshStandardMaterial color="#0E4FE7" />
          </mesh>
          <mesh geometry={nodes.Rig_3.geometry}>
            <meshStandardMaterial color="#656565" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Tailwind">
        <group position={[-2.1, 4.2, 0]}>
          <mesh geometry={nodes.Tailwind_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Tailwind_2.geometry}>
            <meshStandardMaterial color="#06B6D4" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="CSS">
        <group position={[0, 4.2, -2.1]}>
          <mesh geometry={nodes.CSS_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.CSS_2.geometry}>
            <meshStandardMaterial color="#663399" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="JS">
        <group position={[2.1, 4.2, -2.1]}>
          <mesh geometry={nodes.JS_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.JS_2.geometry}>
            <meshStandardMaterial color="#F7DF1E" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="HTML">
        <group position={[-2.1, 4.2, -2.1]}>
          <mesh geometry={nodes.Html.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Html_1.geometry}>
            <meshStandardMaterial color="#E34F26" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Typescript">
        <group position={[0, 4.2, 2.1]}>
          <mesh geometry={nodes.Typescript_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Typescript_2.geometry}>
            <meshStandardMaterial color="#3178C6" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="ThreeJS">
        <group position={[2.1, 4.2, 2.1]}>
          <mesh geometry={nodes.ThreeJS_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.ThreeJS_2.geometry}>
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="GSAP">
        <group position={[-2.1, 4.2, 2.1]}>
          <mesh geometry={nodes.Gsap.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Gsap_1.geometry}>
            <meshStandardMaterial color="#0AE448" />
          </mesh>
        </group>
      </HoverCube>
      {/* Core layer */}
      <HoverCube onHover={onHover} name="Next">
        <group>
          <mesh geometry={nodes.Next_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Next_2.geometry}>
            <meshStandardMaterial color="#111111" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="NodeJS">
        <group position={[2.1, 0, 0]}>
          <mesh geometry={nodes.NodeJS_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.NodeJS_2.geometry}>
            <meshStandardMaterial color="#5FA04E" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Postgres">
        <group position={[-2.1, 0, 0]}>
          <mesh geometry={nodes.Postgres_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Postgres_2.geometry}>
            <meshStandardMaterial color="#4169E1" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Express">
        <group position={[0, 0, -2.1]}>
          <mesh geometry={nodes.Express_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Express_2.geometry}>
            <meshStandardMaterial color="#47848F" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Kubernetes">
        <group position={[2.1, 0, -2.1]}>
          <mesh geometry={nodes.Kubernetes_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Kubernetes_2.geometry}>
            <meshStandardMaterial color="#326CE5" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Electron">
        <group position={[-2.1, 0, -2.1]}>
          <mesh geometry={nodes.Electron_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Electron_2.geometry}>
            <meshStandardMaterial color="#47848F" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Git">
        <group position={[0, 0, 2.1]}>
          <mesh geometry={nodes.Git_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Git_2.geometry}>
            <meshStandardMaterial color="#F05032" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Docker">
        <group position={[2.1, 0, 2.1]}>
          <mesh geometry={nodes.Docker_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Docker_2.geometry}>
            <meshStandardMaterial color="#2496ED" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="AWS">
        <group position={[-2.1, 0, 2.1]}>
          <mesh geometry={nodes.AWS_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.AWS_2.geometry}>
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh geometry={nodes.AWS_3.geometry}>
            <meshStandardMaterial color="#E77B0D" />
          </mesh>
        </group>
      </HoverCube>
      {/* Logic layer */}
      <HoverCube onHover={onHover} name="Blender(Geo)">
        <group position={[0, 2.1, 0]}>
          <mesh geometry={nodes.Geo.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Geo_1.geometry}>
            <meshStandardMaterial color="#E77503" />
          </mesh>
          <mesh geometry={nodes.Geo_2.geometry}>
            <meshStandardMaterial color="#0E4FE7" />
          </mesh>
          <mesh geometry={nodes.Geo_3.geometry}>
            <meshStandardMaterial color="#656565" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="SubstancePainter">
        <group position={[2.1, 2.1, 0]}>
          <mesh geometry={nodes.SubstancePainter_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.SubstancePainter_2.geometry}>
            <meshStandardMaterial color="#E70013" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Webgl">
        <group position={[-2.1, 2.1, 0]}>
          <mesh geometry={nodes.WebGL.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.WebGL_1.geometry}>
            <meshStandardMaterial color="#990000" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Blender(Modelling)">
        <group position={[0, 2.1, -2.1]}>
          <mesh geometry={nodes.Modelling.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Modelling_1.geometry}>
            <meshStandardMaterial color="#E77503" />
          </mesh>
          <mesh geometry={nodes.Modelling_2.geometry}>
            <meshStandardMaterial color="#0E4FE7" />
          </mesh>
          <mesh geometry={nodes.Modelling_3.geometry}>
            <meshStandardMaterial color="#656565" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Pytorch">
        <group position={[2.1, 2.1, -2.1]}>
          <mesh geometry={nodes.Pytorch_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Pytorch_2.geometry}>
            <meshStandardMaterial color="#EE4C2C" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Unity">
        <group position={[-2.1, 2.1, -2.1]}>
          <mesh geometry={nodes.Unity_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Unity_2.geometry}>
            <meshStandardMaterial color="#aaaaaa" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Comfy">
        <group position={[0, 2.1, 2.1]}>
          <mesh geometry={nodes.ComfyUI.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.ComfyUI_1.geometry}>
            <meshStandardMaterial color="#E7DA00" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="Python">
        <group position={[2.1, 2.1, 2.1]}>
          <mesh geometry={nodes.Python_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.Python_2.geometry}>
            <meshStandardMaterial color="#3776AB" />
          </mesh>
          <mesh geometry={nodes.Python_3.geometry}>
            <meshStandardMaterial color="#E7B628" />
          </mesh>
        </group>
      </HoverCube>
      <HoverCube onHover={onHover} name="HuggingFace">
        <group position={[-2.1, 2.1, 2.1]}>
          <mesh geometry={nodes.HuggingFace_1.geometry}>
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh geometry={nodes.HuggingFace_2.geometry}>
            <meshStandardMaterial color="#FFD21E" />
          </mesh>
          <mesh geometry={nodes.HuggingFace_3.geometry}>
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh geometry={nodes.HuggingFace_4.geometry}>
            <meshStandardMaterial color="#E77336" />
          </mesh>
        </group>
      </HoverCube>
    </group>
    </>
  );
}

useGLTF.preload("/Cubes.glb");
