"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from "react";
import { UserSettings, defaultSettings } from "@ft-transcendence/contracts";
import {
  getLocalSettings,
  getEffectiveBackground,
  SETTINGS_UPDATED_EVENT,
} from "@/lib/settings";

export function CustomBackground() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Initialize from local storage if available to avoid sync setState in useEffect
    if (typeof window !== "undefined") {
      return getLocalSettings();
    }
    return defaultSettings;
  });
  const [backgroundSrc, setBackgroundSrc] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const loadBackground = useCallback(async (settingsToUse: UserSettings) => {
    const bg = await getEffectiveBackground(settingsToUse);
    setBackgroundSrc(bg);
  }, []);

  useEffect(() => {
    // Load local settings immediately for fast render
    const local = getLocalSettings();

    // Explicitly call async function to avoid linter warning about sync effects
    const init = async () => {
      await loadBackground(local);
    };
    init();

    // Listen for settings updates
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserSettings>;
      const newSettings = customEvent.detail;
      setSettings(newSettings);
      loadBackground(newSettings);
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    return () =>
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
  }, [loadBackground]);

  if (!backgroundSrc) {
    return null;
  }

  const [blur, brightness, saturate, opacity] = settings.customBackgroundFilter;

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    objectFit:
      settings.customBackgroundSize === "max"
        ? "none"
        : (settings.customBackgroundSize as "cover" | "contain"),
    filter: `blur(${blur}rem) brightness(${brightness}) saturate(${saturate})`,
    opacity: imageLoaded ? opacity : 0,
    width: blur > 0 ? `calc(100% + ${blur * 4}rem)` : "100%",
    height: blur > 0 ? `calc(100% + ${blur * 4}rem)` : "100%",
    left: blur > 0 ? `-${blur * 2}rem` : "0",
    top: blur > 0 ? `-${blur * 2}rem` : "0",
    transition: "opacity 0.3s ease",
  };

  return (
    <div
      className="custom-background"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <img
        src={backgroundSrc}
        alt=""
        style={imgStyle}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
      />
    </div>
  );
}
