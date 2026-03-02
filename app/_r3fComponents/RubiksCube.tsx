"use client";
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import TestCube from "./TestCube";

export default function RubiksCube() {
  const [cubeHovered, setCubeHovered] = useState(false);

  return (
    <>
      {/* Disabled while hovering the cube so drags aren't stolen by orbit */}
      {/* <OrbitControls
        enabled={!cubeHovered}
        enablePan={false}
        minDistance={10}
        maxDistance={20}
        enableDamping
        dampingFactor={0.08}
      /> */}
      <TestCube setHovered={setCubeHovered} />
    </>
  );
}
