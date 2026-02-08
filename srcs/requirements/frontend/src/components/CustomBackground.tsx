"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from "react";
import { UserSettings, defaultSettings } from "@ft-transcendence/contracts";
import {
  getLocalSettings,
  setLocalSettings,
  getEffectiveBackground,
  SETTINGS_UPDATED_EVENT,
} from "@/lib/settings";
import { api } from "@/lib/api";

export function CustomBackground() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [backgroundSrc, setBackgroundSrc] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const loadBackground = useCallback(async (settingsToUse: UserSettings) => {
    const bg = await getEffectiveBackground(settingsToUse);
    setBackgroundSrc(bg);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.settings.getSettings({
        extraHeaders: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 200) {
        setSettings(response.body);
        setLocalSettings(response.body);
        loadBackground(response.body);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }, [loadBackground]);

  useEffect(() => {
    // Load local settings immediately for fast render
    const local = getLocalSettings();
    setSettings(local);
    loadBackground(local);

    // Then try to fetch from API if authenticated
    const token = localStorage.getItem("token");
    if (token) {
      fetchSettings();
    }

    // Listen for settings updates
    const handleUpdate = (e: CustomEvent<UserSettings>) => {
      const newSettings = e.detail;
      setSettings(newSettings);
      loadBackground(newSettings);
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT as any, handleUpdate as any);
    return () =>
      window.removeEventListener(
        SETTINGS_UPDATED_EVENT as any,
        handleUpdate as any,
      );
  }, [fetchSettings, loadBackground]);

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
