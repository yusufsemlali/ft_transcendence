/**
 * Font Controller
 * 
 * Handles dynamic loading and application of fonts from the bundled webfonts.
 * This is the runtime component that injects @font-face rules and applies fonts.
 */

import { FONT_LIST, getFontById, DEFAULT_FONT_ID, type FontDefinition } from "./font-list";

/** Tracks which fonts have been loaded to avoid duplicate @font-face rules */
const loadedFonts = new Set<string>();

/** The style element for injecting @font-face rules */
let fontStyleElement: HTMLStyleElement | null = null;

/**
 * Get or create the style element for font rules
 */
function getFontStyleElement(): HTMLStyleElement {
    if (typeof document === "undefined") {
        throw new Error("Cannot access document in SSR context");
    }

    if (!fontStyleElement) {
        fontStyleElement = document.createElement("style");
        fontStyleElement.id = "dynamic-fonts";
        document.head.appendChild(fontStyleElement);
    }

    return fontStyleElement;
}

/**
 * Generate @font-face CSS rule for a font
 */
function generateFontFaceRule(font: FontDefinition): string {
    // Extract the font family name (without quotes and fallbacks)
    const familyName = font.fontFamily.split(",")[0].replace(/'/g, "").trim();

    return `
@font-face {
    font-family: '${familyName}';
    src: url('/webfonts/${font.fileName}.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
`.trim();
}

/**
 * Load a specific font by injecting its @font-face rule
 */
export function loadFont(fontId: string): boolean {
    if (typeof document === "undefined") return false;

    // Already loaded
    if (loadedFonts.has(fontId)) return true;

    const font = getFontById(fontId);
    if (!font) {
        console.warn(`[FontController] Unknown font: ${fontId}`);
        return false;
    }

    const styleElement = getFontStyleElement();
    const rule = generateFontFaceRule(font);
    styleElement.textContent += "\n" + rule;

    loadedFonts.add(fontId);
    return true;
}

/**
 * Preload all fonts (optional, for instant switching)
 */
export function preloadAllFonts(): void {
    if (typeof document === "undefined") return;

    const styleElement = getFontStyleElement();
    const rules = FONT_LIST.filter((f) => !loadedFonts.has(f.id))
        .map(generateFontFaceRule)
        .join("\n");

    styleElement.textContent += "\n" + rules;
    FONT_LIST.forEach((f) => loadedFonts.add(f.id));
}

/**
 * Apply a font to the document
 * This loads the font if needed and sets the CSS variable
 */
export function applyFont(fontId: string): void {
    if (typeof document === "undefined") return;

    const font = getFontById(fontId);
    if (!font) {
        console.warn(`[FontController] Unknown font: ${fontId}, falling back to default`);
        applyFont(DEFAULT_FONT_ID);
        return;
    }

    // Ensure font is loaded
    loadFont(fontId);

    // Apply to CSS variables (ensures both Tailwind sans and mono utilities update)
    document.documentElement.style.setProperty("--font-mono", font.fontFamily);
    document.documentElement.style.setProperty("--font-sans", font.fontFamily);
}

/**
 * Get the current applied font from CSS variable
 */
export function getCurrentFont(): string | null {
    if (typeof document === "undefined") return null;
    return document.documentElement.style.getPropertyValue("--font-mono") || null;
}

/**
 * Initialize font system with a specific font
 * Call this on app startup
 */
export function initializeFonts(fontId: string = DEFAULT_FONT_ID): void {
    applyFont(fontId);
}
