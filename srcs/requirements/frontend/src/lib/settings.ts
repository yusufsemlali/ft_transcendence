import { UserSettings, defaultSettings } from "@ft-transcendence/contracts";
import { getLocalBackground } from "./file-storage";
import { applyFont } from "./fonts";
import api from "@/lib/api/api";

const SETTINGS_KEY = "tournify_settings";

export function hexToHSL(hex: string): { h: number, s: number, l: number } {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16) / 255;
        g = parseInt(hex[2] + hex[2], 16) / 255;
        b = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16) / 255;
        g = parseInt(hex.slice(3, 5), 16) / 255;
        b = parseInt(hex.slice(5, 7), 16) / 255;
    } else {
        return { h: 344, s: 0.8, l: 0.5 };
    }
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Get settings from localStorage (for instant load before API)
export function getLocalSettings(): UserSettings {
    if (typeof window === "undefined") return defaultSettings;

    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch {
        // Invalid JSON, ignore
    }
    return defaultSettings;
}

// Save settings to localStorage
export function setLocalSettings(settings: Partial<UserSettings>): void {
    if (typeof window === "undefined") return;

    const current = getLocalSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

// Clear local settings
export function clearLocalSettings(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SETTINGS_KEY);
}

// Get the effective background URL (local takes priority)
export async function getEffectiveBackground(settings: UserSettings): Promise<string | null> {
    // Local image takes priority
    const localBg = await getLocalBackground();
    if (localBg) {
        return localBg;
    }

    // Fall back to URL from settings
    return settings.customBackground;
}

// Apply background settings to DOM
export async function applyBackgroundSettings(settings: UserSettings): Promise<void> {
    if (typeof window === "undefined") return;

    const bgElement = document.querySelector(".custom-background") as HTMLElement | null;
    const effectiveBg = await getEffectiveBackground(settings);

    // Only apply if the URL is valid — prevents partial strings from triggering 404s
    const isValidBgUrl = (url: string): boolean => {
        if (url.startsWith("data:") || url.startsWith("blob:")) return true;
        try {
            const parsed = new URL(url);
            return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
            return false;
        }
    };

    if (effectiveBg && isValidBgUrl(effectiveBg) && bgElement) {
        const img = bgElement.querySelector("img") as HTMLImageElement | null;
        if (img) {
            img.src = effectiveBg;

            // Background size
            img.style.objectFit = settings.customBackgroundSize === "max"
                ? "none"
                : settings.customBackgroundSize;

            // Filters [blur, brightness, saturate, opacity]
            const [blur, brightness, saturate, opacity] = settings.customBackgroundFilter;
            img.style.filter = `blur(${blur}rem) brightness(${brightness}) saturate(${saturate})`;
            img.style.opacity = String(opacity);

            // Expand to cover blur edges
            if (blur > 0) {
                img.style.width = `calc(100% + ${blur * 4}rem)`;
                img.style.height = `calc(100% + ${blur * 4}rem)`;
                img.style.left = `-${blur * 2}rem`;
                img.style.top = `-${blur * 2}rem`;
            } else {
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.left = "0";
                img.style.top = "0";
            }
        }
        bgElement.style.display = "block";
    } else if (bgElement) {
        bgElement.style.display = "none";
    }
}

// Apply theme settings
export function applyThemeSettings(settings: UserSettings): void {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Font family - use the font controller
    applyFont(settings.fontFamily);
    
    // Font size multiplier
    root.style.setProperty("--font-size-multiplier", String(settings.fontSize));

    // Force dark theme mode
    root.classList.add("dark");
    root.style.colorScheme = "dark";

    // Theme tokens
    root.style.setProperty("--theme-color", settings.themeColor);

    // Color harmony — compute secondary hex
    const harmonyOffsets: Record<string, number> = {
        complementary: 180,
        analogous: 30,
        triadic: 120,
        split: 150,
    };
    const offset = harmonyOffsets[settings.colorHarmony] ?? 180;
    const hsl = hexToHSL(settings.themeColor);
    const secondaryHue = (hsl.h + offset) % 360;
    const secondaryHex = hslToHex(secondaryHue, hsl.s, hsl.l);

    root.style.setProperty("--theme-color-secondary", secondaryHex);

    root.style.setProperty("--radius-base", `${settings.borderRadius}px`);
    root.style.setProperty("--glass-blur", `${settings.glassBlur}px`);
    root.style.setProperty("--glass-opacity", String(settings.glassOpacity));

    // Custom theme colors (monkeytype style grid)
    if (settings.customTheme && settings.customThemeColors) {
        const colors = settings.customThemeColors;
        root.style.setProperty("--background", colors.bgPrimary ?? "");
        root.style.setProperty("--popover", colors.bgPrimary ?? "");
        root.style.setProperty("--card", colors.bgPrimary ?? "");
        
        root.style.setProperty("--theme-color", colors.accent ?? "");
        root.style.setProperty("--primary", colors.accent ?? "");
        
        root.style.setProperty("--theme-color-secondary", colors.accentSecondary ?? "");
        root.style.setProperty("--ring", colors.accentSecondary ?? "");
        
        root.style.setProperty("--destructive", colors.error ?? "");
        
        root.style.setProperty("--secondary", colors.bgSecondary ?? "");
        
        root.style.setProperty("--muted", colors.textSecondary ?? ""); // Map sub-text properly
        root.style.setProperty("--muted-foreground", colors.textSecondary ?? "");
        
        root.style.setProperty("--foreground", colors.textPrimary ?? "");
        root.style.setProperty("--popover-foreground", colors.textPrimary ?? "");
        root.style.setProperty("--card-foreground", colors.textPrimary ?? "");
    } else {
        // Clear custom overrides to let globals.css cascade back in
        root.style.removeProperty("--background");
        root.style.removeProperty("--popover");
        root.style.removeProperty("--card");
        root.style.removeProperty("--primary");
        root.style.removeProperty("--ring");
        root.style.removeProperty("--destructive");
        root.style.removeProperty("--secondary");
        root.style.removeProperty("--muted");
        root.style.removeProperty("--muted-foreground");
        root.style.removeProperty("--foreground");
        root.style.removeProperty("--popover-foreground");
        root.style.removeProperty("--card-foreground");
    }

    // Smooth animations
    if (!settings.smoothAnimations) {
        root.style.setProperty("--transition-speed", "0s");
    } else {
        root.style.removeProperty("--transition-speed");
    }
}

// Apply all settings
export const SETTINGS_UPDATED_EVENT = "tournify:settings-updated";

export async function applyAllSettings(settings: UserSettings): Promise<void> {
    await applyBackgroundSettings(settings);
    applyThemeSettings(settings);
    
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: settings }));
    }
}

/** Load theme, fonts, and background from the API and apply (after password login, OAuth, or SSR hydration). */
export async function syncUserSettingsFromServer(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
        const response = await api.settings.getSettings({});
        if (response.status === 200) {
            const settings = response.body;
            setLocalSettings(settings);
            await applyAllSettings(settings);
        }
    } catch {
        /* non-critical */
    }
}
