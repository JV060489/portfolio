"use client";

import { useSyncExternalStore } from "react";

function useMediaQuery(query: string): boolean {
  const subscribe = (onStoreChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    const mql = window.matchMedia(query);
    const handler = () => onStoreChange();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  };

  const getSnapshot = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)");
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
}

export function useIsTouchDevice() {
  return useMediaQuery("(hover: none) and (pointer: coarse)");
}
