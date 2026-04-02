"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

const ParentCanvas = dynamic(() => import("./_ParentCanvas/ParentCanvas"), {
  ssr: false,
});
const MobileSite = dynamic(() => import("./_Mobile/MobileSite"), {
  ssr: false,
});
const LoadingScreen = dynamic(
  () => import("./_ParentCanvas/LoadingScreen"),
  { ssr: false },
);
const CursorLight = dynamic(() => import("./_ParentCanvas/CursorLight"), {
  ssr: false,
});

// ── Mobile detection via useSyncExternalStore (no hydration mismatch) ───────
// Matches touch-primary devices OR narrow screens (≤ 768px).
const MOBILE_QUERY =
  "(hover: none) and (pointer: coarse), (max-width: 768px)";

function subscribeToMobile(cb: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

function Page() {
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getMobileSnapshot,
    getServerSnapshot,
  );

  const [assetsReady, setAssetsReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  if (isMobile) {
    return <MobileSite />;
  }

  return (
    <main
      className="relative h-screen"
      style={{ background: "var(--bg, #000000)" }}
    >
      {!assetsReady && (
        <LoadingScreen onComplete={() => setAssetsReady(true)} />
      )}
      {assetsReady && (
        <ParentCanvas onIntroComplete={() => setIntroComplete(true)} />
      )}
      {introComplete && <CursorLight />}
    </main>
  );
}

export default Page;
