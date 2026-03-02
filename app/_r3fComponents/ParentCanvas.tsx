import { Canvas } from "@react-three/fiber";
import React from "react";
import IntroText from "./IntroText";

function ParentCanvas() {
  return (
    <div className="relative h-screen">
      <Canvas
        camera={{ manual: true }}
        style={{ background: "black", width: "100%", height: "100%" }}
      >
        <IntroText />
      </Canvas>
    </div>
  );
}

export default ParentCanvas;
