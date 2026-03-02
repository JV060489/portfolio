"use client";

import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import IntroText from "./IntroText";
import NavCube from "./NavCube";

function ParentCanvas() {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <div className="relative h-screen">
      {/* Main canvas – no orbit controls here */}
      <Canvas
        camera={{ manual: true }}
        style={{ background: "black", width: "100%", height: "100%" }}
      >
        <IntroText onIntroComplete={() => setIntroComplete(true)} />
      </Canvas>

      {/*
        NavCube lives in its own isolated Canvas absolutely positioned
        top-right, so its OrbitControls never touch the main scene.
      */}
      <NavCube visible={introComplete} />
    </div>
  );
}

export default ParentCanvas;
