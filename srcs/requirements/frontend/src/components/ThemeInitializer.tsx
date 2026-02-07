"use client";

import { useEffect } from "react";
import { getLocalSettings, applyAllSettings } from "@/lib/settings";

/**
 * ThemeInitializer Component
 *
 * This component is responsible for applying user settings (font, background, etc.)
 * as soon as the application loads on the client side.
 */
export function ThemeInitializer() {
  useEffect(() => {
    // Load settings from localStorage
    const settings = getLocalSettings();

    // Apply them to the DOM (fonts, themes, etc.)
    applyAllSettings(settings);

    // Optional: Listen for storage changes if you have multiple tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tournify_settings") {
        const updated = getLocalSettings();
        applyAllSettings(updated);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // This component doesn't render anything
  return null;
}
