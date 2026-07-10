"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type EffectQuality = "high" | "low" | "static";

type EffectQualityState = {
  quality: EffectQuality;
  isVisible: boolean;
  isActive: boolean;
};

const initialEffectQuality: EffectQualityState = {
  quality: "high",
  isVisible: true,
  isActive: true,
};

const EffectQualityContext = createContext<EffectQualityState>(initialEffectQuality);

function resolveEffectQuality(reducedMotion: boolean): EffectQuality {
  if (reducedMotion) return "static";
  const cores = navigator.hardwareConcurrency ?? 4;
  return window.innerWidth < 768 || cores <= 4 ? "low" : "high";
}

export function EffectQualityProvider({ children }: { children: ReactNode }) {
  const [quality, setQuality] = useState<EffectQuality>("high");
  const [isVisible, setIsVisible] = useState(true);
  const isActive = isVisible && quality !== "static";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateQuality = () => setQuality(resolveEffectQuality(mediaQuery.matches));
    const updateVisibility = () => setIsVisible(!document.hidden);

    updateQuality();
    updateVisibility();
    window.addEventListener("resize", updateQuality);
    document.addEventListener("visibilitychange", updateVisibility);
    mediaQuery.addEventListener("change", updateQuality);

    return () => {
      window.removeEventListener("resize", updateQuality);
      document.removeEventListener("visibilitychange", updateVisibility);
      mediaQuery.removeEventListener("change", updateQuality);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("effects-high", "effects-low", "effects-static", "effects-paused");
    root.classList.add(`effects-${quality}`);
    if (!isActive) root.classList.add("effects-paused");

    return () => {
      root.classList.remove("effects-high", "effects-low", "effects-static", "effects-paused");
    };
  }, [quality, isActive]);

  const value = useMemo(
    () => ({ quality, isVisible, isActive }),
    [quality, isVisible, isActive],
  );

  return <EffectQualityContext.Provider value={value}>{children}</EffectQualityContext.Provider>;
}

export function useEffectQuality() {
  return useContext(EffectQualityContext);
}
