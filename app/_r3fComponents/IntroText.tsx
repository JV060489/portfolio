"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

// Register CustomEase plugin and create a reusable named curve
gsap.registerPlugin(CustomEase);
CustomEase.create("introZoom", "M0,0 C0.29,0 0.46,0.116 0.472,0.231 0.495,0.468 0.481,0.358 0.498,0.502 0.529,0.771 0.48,0.816 0.564,0.894 0.627,0.952 0.704,1 1,1 ");

// ── Grid dimensions ──────────────────────────────────────────────────────────
const ROWS = 80;
const COLUMNS = 320;
const SPACING = 1;
const BOUNDING_BOX = 400;

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
  varying vec3 vColor;
  varying vec3 vNormal;

  void main() {
    float shadow = dot(normalize(vec3(0.0, 1.0, 1.0)), normalize(vNormal));
    vec3  color  = clamp(vColor * (0.9 + 0.6 * shadow), 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ── Text → canvas texture ────────────────────────────────────────────────────
async function createTextTexture(
  text: string,
  cols: number,
  rows: number,
): Promise<THREE.CanvasTexture> {
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

  return new THREE.CanvasTexture(canvas);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function IntroText() {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const anchorRef = useRef<THREE.Object3D>(new THREE.Object3D()); // virtual anchor
  const camLocalPos = useRef(new THREE.Vector3(0, 0, 1000)); // scratch vector
  const { scene, size } = useThree();

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
      texture = await createTextTexture("JANARTHANAN VASANTH", COLUMNS, ROWS);

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
        },
      });

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
      tl = gsap.timeline();

      // Dither reveal: 10 s, linear
      tl.to(
        material.uniforms.uDitherProgress,
        {
          value: 1,
          duration: 10,
          ease: "none", // use the named CustomEase curve we created above
        },
        0,
      );

      // Camera: settle closer — zoom lands at 1.5 (text fills the screen)
      tl.to(
        cam,
        {
          zoom: 2.5,
          duration: 12,
          // use the named CustomEase curve we created above
          ease: "introZoom",
          onUpdate: () => cam.updateProjectionMatrix(),
        },
        0,
      );

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
    };
  }, [scene]);

  // ── Per-frame: derive camera world position from virtual anchor ───────────
  useFrame(() => {
    const cam = cameraRef.current;
    const anchor = anchorRef.current;
    if (!cam) return;

    // Camera sits at local (0, 0, 1000) inside the anchor
    anchor.updateMatrixWorld(true);
    const worldPos = camLocalPos.current
      .set(0, 0, 1000)
      .applyMatrix4(anchor.matrixWorld);
    cam.position.copy(worldPos);
    cam.lookAt(anchor.position);
  });

  return <OrthographicCamera ref={cameraRef} makeDefault near={1} far={2000} />;
}
