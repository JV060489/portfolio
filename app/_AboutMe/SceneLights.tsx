"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useControls, button } from "leva";
import { TransformControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── Types ────────────────────────────────────────────────────────────────────

type LightType = "ambient" | "directional" | "point" | "spot";

interface BaseLightConfig {
  id: string;
  type: LightType;
  color: string;
  intensity: number;
  visible: boolean;
}

interface AmbientLightConfig extends BaseLightConfig {
  type: "ambient";
}

interface DirectionalLightConfig extends BaseLightConfig {
  type: "directional";
  position: [number, number, number];
  target: [number, number, number];
  castShadow: boolean;
}

interface PointLightConfig extends BaseLightConfig {
  type: "point";
  position: [number, number, number];
  distance: number;
  decay: number;
  castShadow: boolean;
}

interface SpotLightConfig extends BaseLightConfig {
  type: "spot";
  position: [number, number, number];
  target: [number, number, number];
  angle: number;
  penumbra: number;
  distance: number;
  decay: number;
  castShadow: boolean;
}

type LightConfig =
  | AmbientLightConfig
  | DirectionalLightConfig
  | PointLightConfig
  | SpotLightConfig;

type PositionedLightConfig = DirectionalLightConfig | PointLightConfig | SpotLightConfig;
type TargetedLightConfig = DirectionalLightConfig | SpotLightConfig;

// ── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "scene-lights-config";

function loadDefaults(): LightConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LightConfig[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveDefaults(lights: LightConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lights));
}

// ── Counter for unique IDs ───────────────────────────────────────────────────

let idCounter = 0;
function nextId(type: LightType) {
  return `${type}_${++idCounter}`;
}

// ── Default configs per type ─────────────────────────────────────────────────

function createLight(type: LightType): LightConfig {
  const base = {
    id: nextId(type),
    color: "#ffffff",
    intensity: 1,
    visible: true,
  };
  switch (type) {
    case "ambient":
      return { ...base, type: "ambient" };
    case "directional":
      return {
        ...base,
        type: "directional",
        position: [0, 0, 0] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
        castShadow: false,
      };
    case "point":
      return {
        ...base,
        type: "point",
        position: [0, 0, 0] as [number, number, number],
        distance: 0,
        decay: 2,
        castShadow: false,
      };
    case "spot":
      return {
        ...base,
        type: "spot",
        position: [0, 0, 0] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
        angle: Math.PI / 6,
        penumbra: 0.5,
        distance: 0,
        decay: 2,
        castShadow: false,
      };
  }
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SceneLights() {
  const [lights, setLights] = useState<LightConfig[]>(() => {
    const saved = loadDefaults();
    if (saved.length > 0) {
      saved.forEach((l) => {
        const num = parseInt(l.id.split("_").pop() || "0", 10);
        if (num >= idCounter) idCounter = num;
      });
      return saved;
    }
    return [
      { ...createLight("ambient"), intensity: 0.5 },
      {
        ...createLight("directional"),
        position: [0, 0, 0],
        target: [0, 0, 0],
        intensity: 1,
      } as DirectionalLightConfig,
    ];
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleChange = useCallback(
    (id: string, updates: Partial<LightConfig>) => {
      setLights((prev) =>
        prev.map((l) =>
          l.id === id ? ({ ...l, ...updates } as LightConfig) : l,
        ),
      );
    },
    [],
  );

  const handleDelete = useCallback((id: string) => {
    setLights((prev) => prev.filter((l) => l.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const addLight = useCallback((type: LightType) => {
    setLights((prev) => [...prev, createLight(type)]);
  }, []);

  // ── Leva: Add Light menu + Save/Reset ──────────────────────────────────────

  useControls("Scene Lights", () => ({
    "Add Ambient": button(() => addLight("ambient")),
    "Add Directional": button(() => addLight("directional")),
    "Add Point": button(() => addLight("point")),
    "Add Spot": button(() => addLight("spot")),
    "Save Defaults": button(() => {
      setLights((current) => {
        saveDefaults(current);
        console.log("Light configuration saved!", JSON.stringify(current, null, 2));
        return current;
      });
    }),
    "Reset to Saved": button(() => {
      const saved = loadDefaults();
      if (saved.length > 0) {
        saved.forEach((l) => {
          const num = parseInt(l.id.split("_").pop() || "0", 10);
          if (num >= idCounter) idCounter = num;
        });
        setLights(saved);
        setSelectedId(null);
      }
    }),
  }));

  return (
    <>
      {lights.map((light) => (
        <SingleLight
          key={light.id}
          config={light}
          selected={selectedId === light.id}
          onChange={handleChange}
          onDelete={handleDelete}
          onSelect={handleSelect}
        />
      ))}
    </>
  );
}

// ── Individual light renderer ────────────────────────────────────────────────

interface SingleLightProps {
  config: LightConfig;
  selected: boolean;
  onChange: (id: string, updates: Partial<LightConfig>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

function SingleLight({
  config,
  selected,
  onChange,
  onDelete,
  onSelect,
}: SingleLightProps) {
  const hasPosition = config.type !== "ambient";
  const hasTarget = config.type === "spot" || config.type === "directional";
  const isDragging = useRef(false);
  const dragStartPos = useRef(new THREE.Vector3());
  const dragStartTarget = useRef(new THREE.Vector3());
  const meshRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.SpotLight | THREE.DirectionalLight>(null);
  const targetObjRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const { scene } = useThree();

  // Use state to track mounted group so TransformControls can render after mount
  const [groupObj, setGroupObj] = useState<THREE.Group | null>(null);

  const setRefs = useCallback((node: THREE.Group | null) => {
    meshRef.current = node;
    setGroupObj(node);
  }, []);

  // Read initial values (fallback for old saved configs missing target)
  const initPos = hasPosition
    ? (config as PositionedLightConfig).position ?? [0, 0, 0]
    : [0, 0, 0];
  const initTarget = hasTarget
    ? (config as TargetedLightConfig).target ?? [0, 0, 0]
    : [0, 0, 0];

  // Add/remove target object from scene for spot/directional lights
  useEffect(() => {
    if (!hasTarget) return;
    const targetObj = targetObjRef.current;
    scene.add(targetObj);
    return () => {
      scene.remove(targetObj);
    };
  }, [hasTarget, scene]);

  // Sync target position and assign to light
  useEffect(() => {
    if (!hasTarget) return;
    const light = lightRef.current;
    const targetObj = targetObjRef.current;
    const t = (config as TargetedLightConfig).target ?? [0, 0, 0];
    targetObj.position.set(t[0], t[1], t[2]);
    if (light) {
      light.target = targetObj;
    }
  }, [config, hasTarget]);

  // ── Leva panel for this light ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema: Record<string, any> = {
    color: {
      value: config.color,
      onChange: (v: string) => onChange(config.id, { color: v }),
    },
    intensity: {
      value: config.intensity,
      min: 0,
      max: 20,
      step: 0.1,
      onChange: (v: number) => onChange(config.id, { intensity: v }),
    },
    visible: {
      value: config.visible,
      onChange: (v: boolean) => onChange(config.id, { visible: v }),
    },
  };

  if (hasPosition) {
    schema.position = {
      value: { x: initPos[0], y: initPos[1], z: initPos[2] },
      step: 0.1,
      onChange: (v: { x: number; y: number; z: number }) => {
        const group = meshRef.current;
        if (!group || isDragging.current) return;
        group.position.set(v.x, v.y, v.z);
        onChange(config.id, {
          position: [v.x, v.y, v.z],
        } as Partial<LightConfig>);
      },
    };
  }

  if (hasTarget) {
    schema.target = {
      value: { x: initTarget[0], y: initTarget[1], z: initTarget[2] },
      step: 0.1,
      onChange: (v: { x: number; y: number; z: number }) => {
        targetObjRef.current.position.set(v.x, v.y, v.z);
        onChange(config.id, {
          target: [v.x, v.y, v.z],
        } as Partial<LightConfig>);
      },
    };
  }

  if (config.type === "point" || config.type === "spot") {
    schema.distance = {
      value: config.distance,
      min: 0,
      max: 100,
      step: 0.5,
      onChange: (v: number) => onChange(config.id, { distance: v }),
    };
    schema.decay = {
      value: config.decay,
      min: 0,
      max: 5,
      step: 0.1,
      onChange: (v: number) => onChange(config.id, { decay: v }),
    };
  }

  if (config.type === "spot") {
    schema.angle = {
      value: config.angle,
      min: 0,
      max: Math.PI / 2,
      step: 0.01,
      onChange: (v: number) => onChange(config.id, { angle: v }),
    };
    schema.penumbra = {
      value: config.penumbra,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v: number) => onChange(config.id, { penumbra: v }),
    };
  }

  if (config.type !== "ambient") {
    schema.castShadow = {
      value: (config as DirectionalLightConfig).castShadow,
      onChange: (v: boolean) => onChange(config.id, { castShadow: v }),
    };
  }

  schema["Select / Deselect"] = button(() => onSelect(config.id));
  schema["Delete"] = button(() => onDelete(config.id));

  const [, set] = useControls(
    `${config.type.toUpperCase()} - ${config.id}`,
    () => schema,
    [config.id, config.type],
  );

  // Sync leva panel position + move target with light during drag
  useFrame(() => {
    const group = meshRef.current;
    if (!group || !isDragging.current || !hasPosition) return;

    set({
      position: {
        x: group.position.x,
        y: group.position.y,
        z: group.position.z,
      },
    });

    // Move target by the same delta as the light position
    if (hasTarget) {
      const delta = group.position.clone().sub(dragStartPos.current);
      const newTarget = dragStartTarget.current.clone().add(delta);
      targetObjRef.current.position.copy(newTarget);
    }
  });

  if (!config.visible) return null;

  return (
    <>
      {config.type === "ambient" && (
        <ambientLight color={config.color} intensity={config.intensity} />
      )}

      {config.type === "directional" && (
        <group
          ref={setRefs}
          position={[initPos[0], initPos[1], initPos[2]]}
        >
          <directionalLight
            ref={lightRef as React.RefObject<THREE.DirectionalLight>}
            color={config.color}
            intensity={config.intensity}
            castShadow={config.castShadow}
          />
        </group>
      )}

      {config.type === "point" && (
        <group
          ref={setRefs}
          position={[initPos[0], initPos[1], initPos[2]]}
        >
          <pointLight
            color={config.color}
            intensity={config.intensity}
            distance={config.distance}
            decay={config.decay}
            castShadow={config.castShadow}
          />
          <mesh>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial
              color={config.color}
              wireframe
              transparent
              opacity={selected ? 1 : 0.3}
            />
          </mesh>
        </group>
      )}

      {config.type === "spot" && (
        <group
          ref={setRefs}
          position={[initPos[0], initPos[1], initPos[2]]}
        >
          <spotLight
            ref={lightRef as React.RefObject<THREE.SpotLight>}
            color={config.color}
            intensity={config.intensity}
            distance={config.distance}
            decay={config.decay}
            angle={config.angle}
            penumbra={config.penumbra}
            castShadow={config.castShadow}
          />
          <mesh>
            <coneGeometry args={[0.1, 0.2, 8]} />
            <meshBasicMaterial
              color={config.color}
              wireframe
              transparent
              opacity={selected ? 1 : 0.3}
            />
          </mesh>
        </group>
      )}

      {selected && hasPosition && groupObj && (
        <TransformControls
          object={groupObj}
          mode="translate"
          onMouseDown={() => {
            isDragging.current = true;
            const group = meshRef.current;
            if (group) {
              dragStartPos.current.copy(group.position);
            }
            if (hasTarget) {
              dragStartTarget.current.copy(targetObjRef.current.position);
            }
          }}
          onMouseUp={() => {
            isDragging.current = false;
            const group = meshRef.current;
            if (group) {
              const p = group.position;
              set({
                position: { x: p.x, y: p.y, z: p.z },
              });
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const updates: Record<string, any> = {
                position: [p.x, p.y, p.z],
              };
              // Commit moved target too
              if (hasTarget) {
                const t = targetObjRef.current.position;
                updates.target = [t.x, t.y, t.z];
                set({
                  target: { x: t.x, y: t.y, z: t.z },
                });
              }
              onChange(config.id, updates as Partial<LightConfig>);
            }
          }}
        />
      )}
    </>
  );
}
