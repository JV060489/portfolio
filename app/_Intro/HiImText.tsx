"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

// ── Position / size config (tweak these to reposition) ──────────────────────
const HI_IM_POSITION: [number, number, number] = [0, 12, -5];
const HI_IM_FONT_SIZE = 100;

const SCROLL_TEXT_POSITION: [number, number, number] = [0, -85, 0]; // relative to group
const SCROLL_TEXT_FONT_SIZE = 10;
const SCROLL_TEXT_LETTER_SPACING = 0.05;

// ── Component ────────────────────────────────────────────────────────────────

interface HiImTextProps {
  visible: boolean;
  isDark: boolean;
  showScrollText?: boolean;
}

export default function HiImText({
  visible,
  showScrollText = false,
}: HiImTextProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { pointer, camera, gl } = useThree();

  const uMouseView = useMemo(
    () => ({ value: new THREE.Vector3(99999, 99999, 0) }),
    [],
  );
  const uRevealRadius = useMemo(() => ({ value: 0.0 }), []);
  const uFadeIn = useMemo(() => ({ value: 0.0 }), []);
  const pointerInsideRef = useRef(false);
  const pointerActivatedRef = useRef(false); // true only after a real pointermove while visible
  const fadeOutTweenRef = useRef<gsap.core.Tween | null>(null);
  const prevVisible = useRef(false);

  // Reset spotlight state when visibility changes so stale enter/move
  // events from the intro period don't leak through.
  useEffect(() => {
    if (!visible) {
      pointerActivatedRef.current = false;
      uRevealRadius.value = 0;
      fadeOutTweenRef.current?.kill();
      fadeOutTweenRef.current = null;
    }
  }, [visible, uRevealRadius]);

  // Helper: convert a DOM PointerEvent to NDC, project onto text plane, store in uMouseView
  const syncMouseFromEvent = useCallback(
    (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const plane = new THREE.Plane();
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -5),
      );
      const hit = new THREE.Vector3();
      if (rc.ray.intersectPlane(plane, hit)) {
        hit.applyMatrix4(camera.matrixWorldInverse);
        uMouseView.value.copy(hit);
      }
    },
    [gl, camera, uMouseView],
  );

  // Track pointer enter/move/leave on the canvas element
  useEffect(() => {
    const el = gl.domElement;

    const activateSpotlight = (e: PointerEvent) => {
      if (!pointerActivatedRef.current) {
        pointerActivatedRef.current = true;
      }
      pointerInsideRef.current = true;
      // Cancel any ongoing fade-out
      if (fadeOutTweenRef.current) {
        fadeOutTweenRef.current.kill();
        fadeOutTweenRef.current = null;
      }
      syncMouseFromEvent(e);
      uRevealRadius.value = 60.0;
    };

    const onMove = (e: PointerEvent) => activateSpotlight(e);
    const onEnter = (e: PointerEvent) => {
      pointerInsideRef.current = true;
      // Only activate if we've already had a move (avoids stale enter during intro)
      if (pointerActivatedRef.current) {
        activateSpotlight(e);
      }
    };
    const onLeave = () => {
      pointerInsideRef.current = false;
      if (!pointerActivatedRef.current) return;
      // Shrink the reveal radius to 0 so the spotlight fades out smoothly
      fadeOutTweenRef.current = gsap.to(uRevealRadius, {
        value: 0,
        duration: 1.5,
        ease: "power2.out",
      });
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      fadeOutTweenRef.current?.kill();
    };
  }, [gl, uRevealRadius, syncMouseFromEvent]);

  // Shared onBeforeCompile injector — reused for both materials
  const patchShader = useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uMouseView = uMouseView;
      shader.uniforms.uRevealRadius = uRevealRadius;
      shader.uniforms.uFadeIn = uFadeIn;

      // ── Vertex: pass view-space position to fragment ──
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
         varying vec3 vViewPos_spot;`,
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <fog_vertex>",
        `#include <fog_vertex>
         vViewPos_spot = (modelViewMatrix * vec4(position, 1.0)).xyz;`,
      );

      // ── Fragment: spotlight with HDR glow core for bloom ──
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
         uniform vec3  uMouseView;
         uniform float uRevealRadius;
         uniform float uFadeIn;
         varying vec3  vViewPos_spot;`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <premultiplied_alpha_fragment>",
        `#include <premultiplied_alpha_fragment>
         float spotDist = length(vViewPos_spot.xy - uMouseView.xy);
         float spotlight = 1.0 - smoothstep(uRevealRadius * 0.2, uRevealRadius, spotDist);

         // HDR boost near cursor center so bloom picks it up
         float glowCore = 1.0 - smoothstep(0.0, uRevealRadius * 0.35, spotDist);
         gl_FragColor.rgb += gl_FragColor.rgb * glowCore * 2.5;

         gl_FragColor.a *= spotlight * uFadeIn;`,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // "Hi, I'm" material
  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: "#888888",
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = patchShader;
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Scroll to discover" material (separate instance so Three.js compiles it independently)
  const scrollMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: "#888888",
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = patchShader;
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade in when visible becomes true
  useEffect(() => {
    if (visible && !prevVisible.current) {
      uFadeIn.value = 0;
      gsap.to(uFadeIn, {
        value: 1,
        duration: 10,
        ease: "power2.out",
      });
    }
    if (!visible) {
      uFadeIn.value = 0;
    }
    prevVisible.current = visible;
  }, [visible, uFadeIn]);

  // Project pointer onto a math plane at the text's Z, then to view space
  const planeNormal = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const planePoint = useMemo(() => new THREE.Vector3(0, 0, -5), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);
  const raycasterLocal = useMemo(() => new THREE.Raycaster(), []);
  const viewPoint = useMemo(() => new THREE.Vector3(), []);

  const getMouseViewPos = useCallback(() => {
    raycasterLocal.setFromCamera(pointer, camera);
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);
    const hit = raycasterLocal.ray.intersectPlane(plane, intersectPoint);
    if (!hit) return null;
    viewPoint.copy(hit).applyMatrix4(camera.matrixWorldInverse);
    return viewPoint;
  }, [
    pointer,
    camera,
    raycasterLocal,
    planeNormal,
    planePoint,
    intersectPoint,
    viewPoint,
  ]);

  useFrame(() => {
    if (!visible || !pointerInsideRef.current || !pointerActivatedRef.current)
      return;

    const vp = getMouseViewPos();
    if (vp) {
      uMouseView.value.copy(vp);
    }
  });

  return (
    <group ref={groupRef} position={HI_IM_POSITION} visible={visible}>
      <Text
        font="/fonts/Ephesis-Regular.ttf"
        fontSize={HI_IM_FONT_SIZE}
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        material={material}
      >
        {"Hi, I'm"}
      </Text>
    </group>
  );
}
