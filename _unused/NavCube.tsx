"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import gsap from "gsap";
import * as THREE from "three";
import PixelBurstReveal, { PixelBurstHandle } from "./PixelBurst";

// Color palette for easy changing
const COLORS = {
  // Shader surface colors (as RGB 0..1 arrays)
  baseColor: [0.055, 0.025, 0.11],
  surfaceColor: [0.1, 0.05, 0.19],
  catchlight: [0.52, 0.3, 0.9],
  // Canvas / text colors (CSS strings)
  canvasBackground: "#000000",
  textFill: "#ffffff",
  textShadow: "#ffffff",
  // Default neon when no label-specific neon is provided
  defaultNeon: [1.0, 1.0, 1.0],
  // Per-face neon palette (as RGB 0..1 arrays)
  neonColors: {
    Intro: [0.05, 1.0, 1.0], // cyan
    About: [1.0, 0.25, 1.0], // magenta
    Skills: [0.2, 1.0, 0.4], // electric green
    Contact: [1.0, 0.65, 0.05], // amber
  },
};

// ─────────────────────────────────────────────────────────────────
//  GLSL — vertex
// ─────────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
  varying vec2  vUv;
  varying vec3  vWorldNormal;

  void main() {
    vUv          = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────────
//  GLSL — fragment
// ─────────────────────────────────────────────────────────────────
const FRAG = /* glsl */ `
  uniform sampler2D textTexture;
  uniform float     glowIntensity;   // spring value, may exceed 1 briefly
  uniform vec3      neonColor;
  uniform bool      hasText;

  varying vec2  vUv;
  varying vec3  vWorldNormal;

  // ── helpers ────────────────────────────────────────────────────
  vec3 faceLight(vec3 col) {
    vec3  L = normalize(vec3(1.2, 1.8, 2.0));
    float d = max(dot(normalize(vWorldNormal), L), 0.0);
    return col * (0.22 + d * 0.38);
  }

  void main() {
    // Dark obsidian base
    vec3 baseColor    = vec3(${COLORS.baseColor.join(", ")});
    vec3 surfaceColor = vec3(${COLORS.surfaceColor.join(", ")});

    // ── Plain (top / bottom) faces ─────────────────────────────
    if (!hasText) {
      gl_FragColor = vec4(faceLight(baseColor), 1.0);
      return;
    }

    // ── Text face ──────────────────────────────────────────────
    float S  = 0.0028;                        // gradient step
    float t  = texture2D(textTexture, vUv).r; // text mask

    // Finite-difference gradient
    float tR = texture2D(textTexture, vUv + vec2( S, 0.0)).r;
    float tL = texture2D(textTexture, vUv - vec2( S, 0.0)).r;
    float tU = texture2D(textTexture, vUv + vec2(0.0,  S)).r;
    float tD = texture2D(textTexture, vUv - vec2(0.0,  S)).r;

    // Inset bump: invert gradient so the letter channels are RECESSED
    vec3 bumpN = normalize(vec3((tL - tR) * 3.2, (tD - tU) * 3.2, 0.85));

    // Key light (top-right) + dim fill
    vec3  keyDir  = normalize(vec3( 1.0,  1.6,  2.0));
    vec3  fillDir = normalize(vec3(-0.8, -0.4,  1.0));
    float key     = max(dot(bumpN, keyDir),  0.0);
    float fill    = max(dot(bumpN, fillDir), 0.0) * 0.18;

    // Ambient-occlusion: carved channel is darker
    float ao = 1.0 - t * 0.60;

    // Carved recess tint
    vec3 carvedColor = mix(surfaceColor, baseColor * 0.30, t);
    vec3 litColor    = carvedColor * (0.18 + key * 0.60 + fill) * ao;

    // Catchlight on carved walls (edge pop)
    float edgeMag = abs(tR - tL) + abs(tU - tD);
    float edge    = smoothstep(0.04, 0.48, edgeMag);
    litColor     += vec3(${COLORS.catchlight.join(", ")}) * edge * 0.55;

    // ── Neon glow (spring-driven) ───────────────────────────────
    // Core: bright text pixels
    vec3 glowCore = neonColor * glowIntensity * t;

    // Bloom: soft halo leaks past the text outline
    float B  = 0.012;
    float b0 = 0.0085;
    float bloom =
        texture2D(textTexture, vUv + vec2( B,   0.0)).r
      + texture2D(textTexture, vUv + vec2(-B,   0.0)).r
      + texture2D(textTexture, vUv + vec2( 0.0,  B )).r
      + texture2D(textTexture, vUv + vec2( 0.0, -B )).r
      + texture2D(textTexture, vUv + vec2( b0,  b0 )).r * 0.65
      + texture2D(textTexture, vUv + vec2(-b0,  b0 )).r * 0.65
      + texture2D(textTexture, vUv + vec2( b0, -b0 )).r * 0.65
      + texture2D(textTexture, vUv + vec2(-b0, -b0 )).r * 0.65;
    bloom /= 6.6;
    // Halo only outside the text core
    bloom = max(bloom - t * 0.45, 0.0);
    vec3 glowHalo = neonColor * bloom * glowIntensity * 0.72;

    gl_FragColor = vec4(litColor + glowCore + glowHalo, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────

/** Resolve the Next.js font CSS variable to an actual font-family string. */
function resolveFontFamily(): string {
  if (typeof document === "undefined") return "monospace";
  const val = getComputedStyle(document.body)
    .getPropertyValue("--font-bitcount-single-ink")
    .trim();
  if (!val) return "monospace";
  // Variable looks like: "'__Bitcount_Single_Ink_abc', '__Fallback'"
  return val.split(",")[0].trim().replace(/['"]/g, "");
}

/** Render text onto a CanvasTexture using the Bitcount Single Ink font. */
function buildTextTexture(
  label: string,
  fontFamily: string,
): THREE.CanvasTexture {
  const SIZE = 512;
  const cv = document.createElement("canvas");
  cv.width = SIZE;
  cv.height = SIZE;
  const ctx = cv.getContext("2d")!;

  // Black background – letter pixels will be white (used as a float mask)
  ctx.fillStyle = COLORS.canvasBackground;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Two passes: soft shadow for SDF-like smooth edges, then sharp fill
  const fontSpec = `900 96px "${fontFamily}"`;
  ctx.font = fontSpec;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = COLORS.textShadow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.textFill;
  ctx.fillText(label, SIZE / 2, SIZE / 2);

  ctx.shadowBlur = 0; // sharp second pass for crisp core
  ctx.fillText(label, SIZE / 2, SIZE / 2);

  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

// ─────────────────────────────────────────────────────────────────
//  Face table  (BoxGeometry order: +X -X +Y -Y +Z -Z)
// ─────────────────────────────────────────────────────────────────
const FACE_NORMALS: THREE.Vector3[] = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

const FACE_LABELS: (string | null)[] = [
  "Skills", // +X  Right
  "Contact", // -X  Left
  null, // +Y  Top
  null, // -Y  Bottom
  "Intro", // +Z  Front
  "About", // -Z  Back
];

const NEON_COLORS: Record<string, THREE.Vector3> = {
  Intro: new THREE.Vector3(...COLORS.neonColors.Intro),
  About: new THREE.Vector3(...COLORS.neonColors.About),
  Skills: new THREE.Vector3(...COLORS.neonColors.Skills),
  Contact: new THREE.Vector3(...COLORS.neonColors.Contact),
};

// White neon — used when a face is facing the camera but not hovered
const WHITE_NEON = new THREE.Vector3(1.0, 1.0, 1.0);

// ─────────────────────────────────────────────────────────────────
//  NavCubeObject – the mesh + spring glow logic
// ─────────────────────────────────────────────────────────────────
type SpringState = { value: number; velocity: number; target: number };

function NavCubeObject() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Which material-index face is currently under the pointer (-1 = none)
  const hoveredFace = useRef<number>(-1);

  // Per-face spring state (raw refs, no re-renders)
  const springs = useRef<SpringState[]>(
    FACE_LABELS.map(() => ({ value: 0, velocity: 0, target: 0 })),
  );

  // ── Create one ShaderMaterial per face ──────────────────────
  const materials = useMemo<THREE.ShaderMaterial[]>(
    () =>
      FACE_LABELS.map(
        (label) =>
          new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            uniforms: {
              textTexture: { value: null },
              glowIntensity: { value: 0.0 },
              neonColor: {
                // Start white — useFrame overrides each tick based on hover
                value: label
                  ? WHITE_NEON.clone()
                  : new THREE.Vector3(...COLORS.defaultNeon),
              },
              hasText: { value: label !== null },
            },
            toneMapped: false, // allow HDR-style overbright glow
          }),
      ),
    [],
  );

  // ── Build textures client-side after font is loaded ─────────
  useEffect(() => {
    document.fonts.ready.then(() => {
      const fontFamily = resolveFontFamily();
      FACE_LABELS.forEach((label, i) => {
        if (label) {
          materials[i].uniforms.textTexture.value = buildTextTexture(
            label,
            fontFamily,
          );
        }
      });
    });

    return () => {
      materials.forEach((m) => {
        m.uniforms.textTexture.value?.dispose();
        m.dispose();
      });
    };
  }, [materials]);

  // ── Assign material array imperatively ──────────────────────
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.material = materials;
    }
  }, [materials]);

  // ── Per-frame: detect facing + spring physics ────────────────
  const worldQuat = useMemo(() => new THREE.Quaternion(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const worldN = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }, delta) => {
    if (!meshRef.current) return;

    meshRef.current.getWorldQuaternion(worldQuat);
    camera.getWorldDirection(camDir); // camera look direction (world space)

    FACE_LABELS.forEach((label, i) => {
      if (!label) return;

      // World-space face normal
      worldN.copy(FACE_NORMALS[i]).applyQuaternion(worldQuat);

      // Face points toward camera when its normal opposes the look direction
      const dot = worldN.dot(camDir); // negative = facing us
      const isFacing = -dot > 0.55; // threshold ~56°

      const sp = springs.current[i];
      sp.target = isFacing ? 1.0 : 0.0;

      // Spring: F = −k(x − target) − c·v
      // Config: under-damped for a bouncy pop
      const k = 310; // stiffness
      const c = 18; // damping  ( ratio ≈ 0.51 → springy )
      const force = -k * (sp.value - sp.target) - c * sp.velocity;
      sp.velocity += force * delta;
      sp.value = Math.max(0, Math.min(1.6, sp.value + sp.velocity * delta));

      materials[i].uniforms.glowIntensity.value = sp.value;

      // Neon color: face-specific when hovered, white when just facing
      const isHovered = hoveredFace.current === i;
      materials[i].uniforms.neonColor.value.copy(
        isHovered ? NEON_COLORS[label] : WHITE_NEON,
      );
    });
  });

  return (
    <mesh
      ref={meshRef}
      onPointerMove={(e) => {
        // BoxGeometry: 2 triangles per face → floor(faceIndex / 2) = material index
        hoveredFace.current = Math.floor((e.faceIndex ?? 0) / 2);
      }}
      onPointerLeave={() => {
        hoveredFace.current = -1;
      }}
    >
      <boxGeometry args={[2, 2, 2]} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────
//  NavCube – isolated Canvas, positioned top-right of the viewport
// ─────────────────────────────────────────────────────────────────
export default function NavCube({ visible }: { visible: boolean }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const burstRef = useRef<PixelBurstHandle>(null);
  // Guard so the burst fires only on first appearance
  const firedRef = useRef(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    gsap.killTweensOf(el);

    if (visible) {
      // Snap to fully visible instantly — the pixel burst is the visual reveal.
      gsap.set(el, { opacity: 1, scale: 1 });
      el.style.pointerEvents = "auto";

      // Fire burst exactly once on first appearance (no delay — cube is already hidden by pixels)
      if (!firedRef.current) {
        firedRef.current = true;
        burstRef.current?.trigger();
      }
    } else {
      // Animate out
      el.style.pointerEvents = "none";
      gsap.to(el, {
        duration: 0.5,
        opacity: 0,
        scale: 0.82,
        ease: "power2.out",
      });
    }
  }, [visible]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        width: 200,
        height: 200,
        zIndex: 20,
        overflow: "hidden",
        // Start fully hidden — useEffect/GSAP owns all opacity & scale transitions
        opacity: 0,
        transform: "scale(0.82)",
        pointerEvents: "auto",
      }}
    >
      {/*
        PixelBurstReveal wraps the Canvas entirely — starts solid black,
        sweeps from top-right to reveal the 3-D scene.
      */}
      <PixelBurstReveal
        ref={burstRef}
        origin="top-right"
        coverColor="#000000"
        style={{ width: "100%", height: "100%" }}
      >
        <Canvas
          camera={{ position: [0, 0, 4.8], fov: 45, near: 0.1, far: 100 }}
          style={{ background: "black", width: "100%", height: "100%" }}
          gl={{ antialias: true }}
        >
          {/* Low ambient so neon glow is dramatic */}
          <ambientLight intensity={0.1} />

          <NavCubeObject />

          <OrbitControls
            enableZoom={false} // user asked for no zoom
            enablePan={false}
            enableDamping
            dampingFactor={0.07}
            rotateSpeed={0.65}
          />
        </Canvas>
      </PixelBurstReveal>
    </div>
  );
}
