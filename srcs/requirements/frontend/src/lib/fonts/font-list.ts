/**
 * Font List Configuration
 * 
 * This file contains the list of all available fonts bundled in public/webfonts.
 * Each font entry maps an ID to its display name and file information.
 */

export interface FontDefinition {
    /** Unique identifier (used in settings, uses underscores) */
    id: string;
    /** Human-readable display name */
    displayName: string;
    /** Filename in /webfonts (without extension) */
    fileName: string;
    /** Font category for filtering */
    category: "monospace" | "sans-serif" | "serif" | "display" | "handwriting";
    /** CSS font-family with fallbacks */
    fontFamily: string;
}

/**
 * All bundled fonts available in the application.
 * These correspond to .woff2 files in public/webfonts/
 */
export const FONT_LIST: FontDefinition[] = [
    // Monospace fonts (primary for code/typing)
    { id: "0xproto", displayName: "0xProto", fileName: "0xProto-Regular", category: "monospace", fontFamily: "'0xProto', monospace" },
    { id: "cascadia_mono", displayName: "Cascadia Mono", fileName: "CascadiaMono-Regular", category: "monospace", fontFamily: "'Cascadia Mono', monospace" },
    { id: "commit_mono", displayName: "Commit Mono", fileName: "CommitMono-Regular", category: "monospace", fontFamily: "'Commit Mono', monospace" },
    { id: "fira_code", displayName: "Fira Code", fileName: "FiraCode-Regular", category: "monospace", fontFamily: "'Fira Code', monospace" },
    { id: "geist_mono", displayName: "Geist Mono", fileName: "GeistMono-Medium", category: "monospace", fontFamily: "'Geist Mono', monospace" },
    { id: "hack", displayName: "Hack", fileName: "Hack-Regular", category: "monospace", fontFamily: "'Hack', monospace" },
    { id: "ibm_plex_mono", displayName: "IBM Plex Mono", fileName: "IBMPlexMono-Regular", category: "monospace", fontFamily: "'IBM Plex Mono', monospace" },
    { id: "inconsolata", displayName: "Inconsolata", fileName: "Inconsolata-Regular", category: "monospace", fontFamily: "'Inconsolata', monospace" },
    { id: "iosevka", displayName: "Iosevka", fileName: "Iosevka-Regular", category: "monospace", fontFamily: "'Iosevka', monospace" },
    { id: "jetbrains_mono", displayName: "JetBrains Mono", fileName: "JetBrainsMono-Regular", category: "monospace", fontFamily: "'JetBrains Mono', monospace" },
    { id: "mononoki", displayName: "Mononoki", fileName: "Mononoki-Regular", category: "monospace", fontFamily: "'Mononoki', monospace" },
    { id: "overpass_mono", displayName: "Overpass Mono", fileName: "OverpassMono-Regular", category: "monospace", fontFamily: "'Overpass Mono', monospace" },
    { id: "roboto_mono", displayName: "Roboto Mono", fileName: "RobotoMono-Regular", category: "monospace", fontFamily: "'Roboto Mono', monospace" },
    { id: "source_code_pro", displayName: "Source Code Pro", fileName: "SourceCodePro-Regular", category: "monospace", fontFamily: "'Source Code Pro', monospace" },
    { id: "ubuntu_mono", displayName: "Ubuntu Mono", fileName: "UbuntuMono-Regular", category: "monospace", fontFamily: "'Ubuntu Mono', monospace" },

    // Sans-serif fonts
    { id: "atkinson_hyperlegible", displayName: "Atkinson Hyperlegible", fileName: "AtkinsonHyperlegible-Regular", category: "sans-serif", fontFamily: "'Atkinson Hyperlegible', sans-serif" },
    { id: "comfortaa", displayName: "Comfortaa", fileName: "Comfortaa-Regular", category: "sans-serif", fontFamily: "'Comfortaa', sans-serif" },
    { id: "geist", displayName: "Geist", fileName: "Geist-Medium", category: "sans-serif", fontFamily: "'Geist', sans-serif" },
    { id: "ibm_plex_sans", displayName: "IBM Plex Sans", fileName: "IBMPlexSans-SemiBold", category: "sans-serif", fontFamily: "'IBM Plex Sans', sans-serif" },
    { id: "kanit", displayName: "Kanit", fileName: "Kanit-Regular", category: "sans-serif", fontFamily: "'Kanit', sans-serif" },
    { id: "lato", displayName: "Lato", fileName: "Lato-Regular", category: "sans-serif", fontFamily: "'Lato', sans-serif" },
    { id: "lexend_deca", displayName: "Lexend Deca", fileName: "LexendDeca-Regular", category: "sans-serif", fontFamily: "'Lexend Deca', sans-serif" },
    { id: "montserrat", displayName: "Montserrat", fileName: "Montserrat-Regular", category: "sans-serif", fontFamily: "'Montserrat', sans-serif" },
    { id: "nunito", displayName: "Nunito", fileName: "Nunito-Bold", category: "sans-serif", fontFamily: "'Nunito', sans-serif" },
    { id: "open_dyslexic", displayName: "OpenDyslexic", fileName: "OpenDyslexic-Regular", category: "sans-serif", fontFamily: "'OpenDyslexic', sans-serif" },
    { id: "oxygen", displayName: "Oxygen", fileName: "Oxygen-Regular", category: "sans-serif", fontFamily: "'Oxygen', sans-serif" },
    { id: "parkinsans", displayName: "Parkinsans", fileName: "Parkinsans-Regular", category: "sans-serif", fontFamily: "'Parkinsans', sans-serif" },
    { id: "roboto", displayName: "Roboto", fileName: "Roboto-Regular", category: "sans-serif", fontFamily: "'Roboto', sans-serif" },
    { id: "sarabun", displayName: "Sarabun", fileName: "Sarabun-Bold", category: "sans-serif", fontFamily: "'Sarabun', sans-serif" },
    { id: "titillium_web", displayName: "Titillium Web", fileName: "TitilliumWeb-Regular", category: "sans-serif", fontFamily: "'Titillium Web', sans-serif" },
    { id: "ubuntu", displayName: "Ubuntu", fileName: "Ubuntu-Regular", category: "sans-serif", fontFamily: "'Ubuntu', sans-serif" },

    // Display/decorative fonts
    { id: "boon", displayName: "Boon", fileName: "Boon-Regular", category: "display", fontFamily: "'Boon', sans-serif" },
    { id: "gallaudet", displayName: "Gallaudet", fileName: "GallaudetRegular", category: "display", fontFamily: "'Gallaudet', sans-serif" },
    { id: "lalezar", displayName: "Lalezar", fileName: "Lalezar-Regular", category: "display", fontFamily: "'Lalezar', sans-serif" },
    { id: "noto_naskh_arabic", displayName: "Noto Naskh Arabic", fileName: "NotoNaskhArabic-Regular", category: "display", fontFamily: "'Noto Naskh Arabic', serif" },
    { id: "vazirmatn", displayName: "Vazirmatn", fileName: "Vazirmatn-Regular", category: "display", fontFamily: "'Vazirmatn', sans-serif" },

    // Handwriting fonts
    { id: "coming_soon", displayName: "Coming Soon", fileName: "ComingSoon-Regular", category: "handwriting", fontFamily: "'Coming Soon', cursive" },
    { id: "itim", displayName: "Itim", fileName: "Itim-Regular", category: "handwriting", fontFamily: "'Itim', cursive" },
];

/** Default font ID */
export const DEFAULT_FONT_ID = "roboto_mono";

/** Get a font by ID */
export function getFontById(id: string): FontDefinition | undefined {
    return FONT_LIST.find((font) => font.id === id);
}

/** Get fonts by category */
export function getFontsByCategory(category: FontDefinition["category"]): FontDefinition[] {
    return FONT_LIST.filter((font) => font.category === category);
}

/** Get all font IDs as a union type for validation */
export const FONT_IDS = FONT_LIST.map((f) => f.id) as [string, ...string[]];
