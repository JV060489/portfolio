"use client";

import { useState } from "react";
import ParentCanvas from "./_r3fComponents/ParentCanvas";
import LoadingScreen from "./_r3fComponents/LoadingScreen";

function Page() {
  const [assetsReady, setAssetsReady] = useState(false);

  return (
    <main
      className="relative h-screen"
      style={{ background: "var(--bg, #000000)" }}
    >
      {!assetsReady && (
        <LoadingScreen onComplete={() => setAssetsReady(true)} />
      )}
      {assetsReady && <ParentCanvas />}
    </main>
  );
}

export default Page;