import { UserSettings, defaultSettings } from "@ft-transcendence/contracts";
import { getLocalBackground } from "./file-storage";
import { applyFont } from "./fonts";

const SETTINGS_KEY = "tournify_settings";

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

    if (effectiveBg && bgElement) {
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

    // Custom theme colors
    if (settings.customTheme && settings.customThemeColors) {
        const colors = settings.customThemeColors;
        root.style.setProperty("--bg-primary", colors.bgPrimary);
        root.style.setProperty("--bg-secondary", colors.bgSecondary);
        root.style.setProperty("--bg-tertiary", colors.bgTertiary);
        root.style.setProperty("--text-primary", colors.textPrimary);
        root.style.setProperty("--text-secondary", colors.textSecondary);
        root.style.setProperty("--text-muted", colors.textMuted);
        root.style.setProperty("--accent-primary", colors.accent);
        root.style.setProperty("--accent-secondary", colors.accentSecondary);
        root.style.setProperty("--accent-error", colors.error);
        root.style.setProperty("--accent-success", colors.success);
    }

    // Smooth animations
    if (!settings.smoothAnimations) {
        root.style.setProperty("--transition-speed", "0s");
    } else {
        root.style.removeProperty("--transition-speed");
    }
}

// Apply all settings
export async function applyAllSettings(settings: UserSettings): Promise<void> {
    await applyBackgroundSettings(settings);
    applyThemeSettings(settings);
}
