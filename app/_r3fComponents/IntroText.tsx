"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

// Register CustomEase plugin and create a reusable named curve
gsap.registerPlugin(CustomEase);
CustomEase.create(
  "introZoom",
  "M0,0 C0.29,0 0.46,0.116 0.472,0.231 0.495,0.468 0.481,0.358 0.498,0.502 0.529,0.771 0.48,0.816 0.564,0.894 0.627,0.952 0.704,1 1,1 ",
);

// ── Dev toggle: set to true to skip the intro animation ─────────────────────
const SKIP_INTRO = true;

// ── Grid dimensions ──────────────────────────────────────────────────────────
const ROWS = 80;
const COLUMNS = 320;
const SPACING = 1;
const BOUNDING_BOX = 400;
const HOVER_RADIUS = 5; // cells around the cursor that get triggered

// ── Bayer 4×4 threshold map ──────────────────────────────────────────────────
const BAYER_4X4_DATA = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const BAYER_SIZE = 4;

// ── Simplex noise GLSL (Ashima Arts / Ian McEwan) ────────────────────────────
const SIMPLEX_NOISE_GLSL = /* glsl */ `
  vec3 mod289_sn(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289_sn(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute_sn(vec3 x) { return mod289_sn(((x * 34.0) + 10.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
     -0.577350269189626, 0.024390243902439
    );
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289_sn(i);
    vec3 p = permute_sn(permute_sn(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

// ── Shaders ──────────────────────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  uniform float uRowSize;
  uniform float uColumnSize;
  uniform float uDitherProgress;
  uniform float uGridOffsetStart;
  uniform float uGridOffsetEnd;
  uniform sampler2D uTexture;

  attribute float aRow;
  attribute float aColumn;
  attribute float aThreshold;

  varying vec3 vColor;
  varying vec3 vNormal;

  ${SIMPLEX_NOISE_GLSL}

  void main() {
    // Sample the texel centers to avoid off-by-one / bleeding that causes
    // missing/extra cells around edges
    vec2 st = (vec2(aColumn + 0.5, (uRowSize - 1.0 - aRow) + 0.5))
            / vec2(uColumnSize, uRowSize);

    float bayerThreshold = aThreshold;
    float rowId    = aRow    / uRowSize;
    float columnId = aColumn / uColumnSize;

    vec4  texColor    = texture2D(uTexture, st);
    float targetColor = texColor.r;

    // Randomised per-cell delay so cells reveal at different times
    float cellDelayIndex = snoise(vec2(rowId, columnId) * 80.7);
    cellDelayIndex = smoothstep(-1.0, 1.0, cellDelayIndex);

    float animDuration = 0.15;
    float animDelay    = cellDelayIndex * (1.0 - animDuration);
    float animEnd      = animDelay + animDuration;
    float animProgress = smoothstep(animDelay, animEnd, uDitherProgress);

    // Discard entirely any cell that has no text pixel — only text cells rendered
    if (targetColor < 0.01) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }

    float ditheredColor = step(bayerThreshold, targetColor);
    float finalColor    = mix(0.0, ditheredColor, smoothstep(0.0, 1.0, animProgress));

    // Clip off cells not yet revealed so background shows cleanly
    if (finalColor < 0.01) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }

    float cellOffset = mix(uGridOffsetStart, uGridOffsetEnd, finalColor);

    vec4 cellPos   = modelMatrix * instanceMatrix * vec4(position, 1.0);
    cellPos.z     += cellOffset;
    vec4 worldNorm = modelMatrix * instanceMatrix * vec4(normal, 0.0);

    gl_Position = projectionMatrix * viewMatrix * cellPos;
    vColor  = vec3(finalColor);
    vNormal = normalize(worldNorm.xyz);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uInvert;
  varying vec3 vColor;
  varying vec3 vNormal;

  void main() {
    float shadow = dot(normalize(vec3(0.0, 1.0, 1.0)), normalize(vNormal));
    vec3  color  = clamp(vColor * (0.9 + 0.6 * shadow), 0.0, 1.0);
    // Flip cube color for light mode (uInvert = 1.0) — dark cubes on white bg
    color = mix(color, vec3(1.0) - color, uInvert);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ── Text → canvas texture + CPU pixel mask ──────────────────────────────────
async function createTextTexture(
  text: string,
  cols: number,
  rows: number,
): Promise<{ texture: THREE.CanvasTexture; mask: Uint8Array }> {
  // Ensure Pixelify Sans is loaded before drawing
  await document.fonts.load(`400 40px "Pixelify Sans"`);

  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d")!;

  // Black background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, cols, rows);

  // Find the largest font size that fits within 90% of the canvas width
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let fontSize = Math.floor(rows * 0.7);
  ctx.font = `400 ${fontSize}px "Pixelify Sans", monospace`;
  const targetW = cols * 0.9;
  const measured = ctx.measureText(text).width;
  if (measured > 0) {
    fontSize = Math.floor(fontSize * (targetW / measured));
  }
  ctx.font = `400 ${fontSize}px "Pixelify Sans", monospace`;

  // White text
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, cols / 2, rows / 2);

  const texture = new THREE.CanvasTexture(canvas);

  // Build a CPU-side mask so hover only fires on real text cells.
  // Sample each cell at its texel-centre (matching the shader's UV formula).
  const imageData = ctx.getImageData(0, 0, cols, rows);
  const count = rows * cols;
  const mask = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    // texel centre, same mapping as the vertex shader:
    // st = (col + 0.5, (rows - 1 - row) + 0.5) / (cols, rows)
    const texRow = rows - 1 - row; // flip Y
    const pixelIdx = (Math.round(texRow) * cols + Math.round(col)) * 4;
    mask[i] = imageData.data[pixelIdx] > 10 ? 1 : 0;
  }

  return { texture, mask };
}

// ── Component ────────────────────────────────────────────────────────────────
interface IntroTextProps {
  onIntroComplete?: () => void;
  isDark?: boolean;
}

export default function IntroText({ onIntroComplete, isDark = true }: IntroTextProps) {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const anchorRef = useRef<THREE.Object3D>(new THREE.Object3D()); // virtual anchor
  const camLocalPos = useRef(new THREE.Vector3(0, 0, 1000));

  // Keep a stable ref so the GSAP timeline always calls the latest callback
  // without needing to be listed as a useEffect dependency.
  const onIntroCompleteRef = useRef(onIntroComplete);
  useEffect(() => {
    onIntroCompleteRef.current = onIntroComplete;
  }, [onIntroComplete]);

  // ── Hover-related refs ───────────────────────────────────────────────────
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const textMaskRef = useRef<Uint8Array | null>(null); // 1 = text cell
  const zHoverRef = useRef<Float32Array | null>(null); // per-cell hover Z
  const animatingRef = useRef<Set<number>>(new Set()); // IDs with active tween
  const animDoneRef = useRef(false); // intro complete?
  const matScratch = useRef(new THREE.Matrix4());
  // Only true after a real pointermove fires — prevents the default (0,0)
  // pointer position from triggering hover on the center cells at anim end.
  const pointerActiveRef = useRef(false);

  const { scene, size, raycaster, pointer, gl } = useThree();

  // ── Track real pointer presence on the canvas ──────────────────────────────
  useEffect(() => {
    const el = gl.domElement;
    const onMove = () => {
      pointerActiveRef.current = true;
    };
    const onLeave = () => {
      pointerActiveRef.current = false;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [gl]);

  // ── Resize handler ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const aspect = size.width / size.height;
    if (aspect < 1) {
      cam.left = -BOUNDING_BOX / 2;
      cam.right = BOUNDING_BOX / 2;
      cam.top = BOUNDING_BOX / 2 / aspect;
      cam.bottom = -BOUNDING_BOX / 2 / aspect;
    } else {
      cam.left = (-BOUNDING_BOX / 2) * aspect;
      cam.right = (BOUNDING_BOX / 2) * aspect;
      cam.top = BOUNDING_BOX / 2;
      cam.bottom = -BOUNDING_BOX / 2;
    }
    cam.updateProjectionMatrix();
  }, [size]);

  // ── Build grid + GSAP timeline ─────────────────────────────────────────────
  useEffect(() => {
    const cam = cameraRef.current;
    if (!cam || typeof window === "undefined") return;

    let tl: gsap.core.Timeline | null = null;
    let group: THREE.Group | null = null;
    let mesh: THREE.InstancedMesh | null = null;
    let geometry: THREE.BoxGeometry | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let texture: THREE.CanvasTexture | null = null;
    const animating = animatingRef.current; // stable Set reference for cleanup

    const count = ROWS * COLUMNS;

    // Build per-instance attribute arrays
    const rowArr = new Float32Array(count);
    const colArr = new Float32Array(count);
    const thresholdArr = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / COLUMNS);
      const col = i % COLUMNS;
      rowArr[i] = row;
      colArr[i] = col;
      const mRow = row % BAYER_SIZE;
      const mCol = col % BAYER_SIZE;
      thresholdArr[i] =
        BAYER_4X4_DATA[mCol + mRow * BAYER_SIZE] / BAYER_4X4_DATA.length;
    }

    // Geometry
    geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.setAttribute(
      "aRow",
      new THREE.InstancedBufferAttribute(rowArr, 1),
    );
    geometry.setAttribute(
      "aColumn",
      new THREE.InstancedBufferAttribute(colArr, 1),
    );
    geometry.setAttribute(
      "aThreshold",
      new THREE.InstancedBufferAttribute(thresholdArr, 1),
    );

    // Text texture (async — waits for Pixelify Sans to be ready)
    const buildScene = async () => {
      const { texture: tex, mask } = await createTextTexture(
        "JANARTHANAN VASANTH",
        COLUMNS,
        ROWS,
      );
      texture = tex;
      textMaskRef.current = mask;

      // Material
      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uRowSize: { value: ROWS },
          uColumnSize: { value: COLUMNS },
          uGridOffsetStart: { value: 0 },
          uGridOffsetEnd: { value: 5 }, // larger Z offset for visible pop-out
          uTexture: { value: texture },
          uDitherProgress: { value: 0.04 },
          uInvert: { value: 0.0 },
        },
      });
      materialRef.current = material;

      // Instanced mesh: place each cell
      mesh = new THREE.InstancedMesh(geometry!, material, count);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / COLUMNS);
        const col = i % COLUMNS;
        const x = (col - (COLUMNS - 1) / 2) * SPACING;
        const y = (-row + (ROWS - 1) / 2) * SPACING;
        dummy.position.set(x, y, 0);
        dummy.scale.set(1, 1, 0.5); // thicker cells so Z offset is visible
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      // Expose mesh + hover Z buffer for useFrame
      meshRef.current = mesh;
      zHoverRef.current = new Float32Array(count); // all zeros
      animDoneRef.current = false;

      group = new THREE.Group();
      group.add(mesh);
      scene.add(group);

      // ── Virtual camera anchor (drives camera position/orientation) ────────────
      const anchor = anchorRef.current;
      anchor.rotation.order = "ZXY";
      // Look down at 45° from the top (keep this orientation for the whole animation)
      anchor.rotation.x = Math.PI * 0.25; // 45°
      anchor.rotation.z = 0; // no in-plane unwind
      // start centered so the grid is visible immediately (zoomed-in)
      anchor.position.set(0, 0, 0);

      // Set initial camera zoom
      cam.zoom = 70;
      cam.updateProjectionMatrix();

      // ── GSAP timeline ─────────────────────────────────────────────────────────
      if (SKIP_INTRO) {
        // Jump straight to the post-animation state
        material.uniforms.uDitherProgress.value = 1;
        cam.zoom = 2.5;
        cam.updateProjectionMatrix();
        animDoneRef.current = true;
        // Notify parent on next tick so React commit phase is done
        requestAnimationFrame(() => onIntroCompleteRef.current?.());
      } else {
        tl = gsap.timeline({
          onComplete: () => {
            animDoneRef.current = true; // unlock hover once intro finishes
            onIntroCompleteRef.current?.();
          },
        });

        // Dither reveal: 10 s, linear
        tl.to(
          material.uniforms.uDitherProgress,
          {
            value: 1,
            duration: 6,
            ease: "none",
          },
          0,
        );

        // Camera: settle closer — zoom lands at 2.5 (text fills the screen)
        tl.to(
          cam,
          {
            zoom: 2.5,
            duration: 8,
            ease: "introZoom",
            onUpdate: () => cam.updateProjectionMatrix(),
          },
          0,
        );
      }

      // (removed anchor pan so the scene starts centered and zoom animation plays from there)
    }; // end buildScene

    buildScene();

    // Cleanup
    return () => {
      tl?.kill();
      if (group) scene.remove(group);
      mesh?.dispose();
      geometry?.dispose();
      material?.dispose();
      texture?.dispose();
      // Reset hover state
      meshRef.current = null;
      textMaskRef.current = null;
      zHoverRef.current = null;
      animating.clear();
      animDoneRef.current = false;
    };
  }, [scene]);

  // ── Per-cell hover trigger (fires once per instance on first intersect) ──────
  const triggerHover = (id: number, staggerDelay = 0) => {
    const zHover = zHoverRef.current;
    if (!zHover) return;
    animatingRef.current.add(id);

    const proxy = { z: 0 };
    // Jump up quickly, then spring back immediately with no hold
    gsap.to(proxy, {
      z: 5,
      duration: 0.18,
      delay: staggerDelay,
      ease: "back.out(1)",
      onUpdate: () => {
        zHover[id] = proxy.z;
      },
      onComplete: () => {
        gsap.to(proxy, {
          z: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.45)",
          onUpdate: () => {
            zHover[id] = proxy.z;
          },
          onComplete: () => {
            animatingRef.current.delete(id);
          },
        });
      },
    });
  };

  // ── Sync isDark → uInvert uniform whenever theme changes ─────────────────
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uInvert.value = isDark ? 0.0 : 1.0;
    }
  }, [isDark]);

  // ── Per-frame: camera + hover matrix flush + raycasting ──────────────────
  useFrame(() => {
    const cam = cameraRef.current;
    const anchor = anchorRef.current;
    if (!cam) return;

    // Camera: derive world position from virtual anchor
    anchor.updateMatrixWorld(true);
    const worldPos = camLocalPos.current
      .set(0, 0, 1000)
      .applyMatrix4(anchor.matrixWorld);
    cam.position.copy(worldPos);
    cam.lookAt(anchor.position);

    // Nothing to do until the intro animation has completed
    if (!animDoneRef.current) return;
    const mesh = meshRef.current;
    const zHover = zHoverRef.current;
    const mask = textMaskRef.current;
    if (!mesh || !zHover || !mask) return;

    // Flush per-instance hover Z offsets into the instance matrices.
    // This must run even when the pointer has left the canvas so that
    // in-progress spring-back tweens can finish updating their cells.
    if (animatingRef.current.size > 0) {
      const mat = matScratch.current;
      animatingRef.current.forEach((id) => {
        mesh.getMatrixAt(id, mat);
        mat.elements[14] = zHover[id]; // column-major: element 14 = Z translation
        mesh.setMatrixAt(id, mat);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Raycast only while the pointer is actually over the canvas
    if (!pointerActiveRef.current) return;

    // Raycast using R3F's auto-updated pointer + raycaster
    raycaster.setFromCamera(pointer, cam);
    const hits = raycaster.intersectObject(mesh, false);
    if (hits.length > 0) {
      const hitId = hits[0].instanceId;
      if (hitId !== undefined && mask[hitId] === 1) {
        const hitRow = Math.floor(hitId / COLUMNS);
        const hitCol = hitId % COLUMNS;

        // Trigger every text cell within HOVER_RADIUS grid-cells of the hit
        for (let dr = -HOVER_RADIUS; dr <= HOVER_RADIUS; dr++) {
          for (let dc = -HOVER_RADIUS; dc <= HOVER_RADIUS; dc++) {
            const dist = Math.sqrt(dr * dr + dc * dc);
            if (dist > HOVER_RADIUS) continue;
            const r = hitRow + dr;
            const c = hitCol + dc;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLUMNS) continue;
            const nid = r * COLUMNS + c;
            if (mask[nid] !== 1 || animatingRef.current.has(nid)) continue;
            // Stagger ripples outward from the center (max ~0.08 s at edge)
            triggerHover(nid, (dist / HOVER_RADIUS) * 0.08);
          }
        }
      }
    }
  });

  return <OrthographicCamera ref={cameraRef} makeDefault near={1} far={2000} />;
}
