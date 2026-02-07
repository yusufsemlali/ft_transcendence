import { z } from "zod";

// Background customization
export const CustomBackgroundSizeSchema = z.enum(["cover", "contain", "max"]);
export type CustomBackgroundSize = z.infer<typeof CustomBackgroundSizeSchema>;

export const CustomBackgroundFilterSchema = z.tuple([
    z.number().min(0).max(10),    // blur (rem)
    z.number().min(0).max(2),     // brightness
    z.number().min(0).max(2),     // saturate
    z.number().min(0).max(1),     // opacity
]);
export type CustomBackgroundFilter = z.infer<typeof CustomBackgroundFilterSchema>;

export const CustomBackgroundSchema = z
    .string()
    .url("Must be a valid URL")
    .regex(/^https?:\/\/.*/, "Must use http or https protocol")
    .regex(/^[^`'"]*$/, "May not contain quotes")
    .regex(/\.(png|gif|jpeg|jpg|webp)(\?.*)?$/i, "Must be an image URL (png, gif, jpeg, jpg, webp)")
    .max(2048, "URL is too long")
    .nullable();
export type CustomBackground = z.infer<typeof CustomBackgroundSchema>;

// Theme customization
export const ColorHexSchema = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a valid hex color");
export type ColorHex = z.infer<typeof ColorHexSchema>;

export const ThemeColorsSchema = z.object({
    bgPrimary: ColorHexSchema,
    bgSecondary: ColorHexSchema,
    bgTertiary: ColorHexSchema,
    textPrimary: ColorHexSchema,
    textSecondary: ColorHexSchema,
    textMuted: ColorHexSchema,
    accent: ColorHexSchema,
    accentSecondary: ColorHexSchema,
    error: ColorHexSchema,
    success: ColorHexSchema,
});
export type ThemeColors = z.infer<typeof ThemeColorsSchema>;

export const ThemePresetSchema = z.enum([
    "default",
    "serika_dark",
    "serika",
    "dracula",
    "nord",
    "monokai",
    "gruvbox_dark",
    "solarized_dark",
    "catppuccin",
    "tokyo_night",
    "custom",
]);
export type ThemePreset = z.infer<typeof ThemePresetSchema>;

// Font customization - All bundled webfonts
export const FontFamilySchema = z.enum([
    // Monospace
    "0xproto",
    "cascadia_mono",
    "commit_mono",
    "fira_code",
    "geist_mono",
    "hack",
    "ibm_plex_mono",
    "inconsolata",
    "iosevka",
    "jetbrains_mono",
    "mononoki",
    "overpass_mono",
    "roboto_mono",
    "source_code_pro",
    "ubuntu_mono",
    // Sans-serif
    "atkinson_hyperlegible",
    "comfortaa",
    "geist",
    "ibm_plex_sans",
    "kanit",
    "lato",
    "lexend_deca",
    "montserrat",
    "nunito",
    "open_dyslexic",
    "oxygen",
    "parkinsans",
    "roboto",
    "sarabun",
    "titillium_web",
    "ubuntu",
    // Display
    "boon",
    "gallaudet",
    "lalezar",
    "noto_naskh_arabic",
    "vazirmatn",
    // Handwriting
    "coming_soon",
    "itim",
]);
export type FontFamily = z.infer<typeof FontFamilySchema>;

export const FontSizeSchema = z.number().min(0.5).max(3);
export type FontSize = z.infer<typeof FontSizeSchema>;

// Complete user settings schema
export const UserSettingsSchema = z.object({
    // Appearance
    theme: ThemePresetSchema.default("default"),
    customTheme: z.boolean().default(false),
    customThemeColors: ThemeColorsSchema.optional().nullable(),
    fontFamily: FontFamilySchema.default("roboto_mono"),
    fontSize: FontSizeSchema.default(1),

    // Custom background - null by default
    customBackground: CustomBackgroundSchema.nullable().default(null),
    customBackgroundSize: CustomBackgroundSizeSchema.default("cover"),
    // Monkeytype defaults: blur 0.5, brightness 0.2, saturate 2.0, opacity 1.0
    customBackgroundFilter: CustomBackgroundFilterSchema.default([0.5, 0.2, 2.0, 1.0]),

    // UI preferences
    smoothAnimations: z.boolean().default(true),
    showKeyboardShortcuts: z.boolean().default(true),
    compactMode: z.boolean().default(false),
    autoSwitchTheme: z.boolean().default(false),

    // Notifications
    soundEnabled: z.boolean().default(true),
    soundVolume: z.number().min(0).max(1).default(0.5),
    desktopNotifications: z.boolean().default(false),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

// Partial for updates
export const PartialUserSettingsSchema = UserSettingsSchema.partial();
export type PartialUserSettings = z.infer<typeof PartialUserSettingsSchema>;

// Default settings - Monkeytype defaults
export const defaultSettings: UserSettings = {
    theme: "default",
    customTheme: false,
    customThemeColors: null,
    fontFamily: "roboto_mono",
    fontSize: 1,
    customBackground: null,
    customBackgroundSize: "cover",
    customBackgroundFilter: [0.5, 0.2, 2.0, 1.0], // blur, brightness, saturate, opacity
    smoothAnimations: true,
    showKeyboardShortcuts: true,
    compactMode: false,
    autoSwitchTheme: false,
    soundEnabled: true,
    soundVolume: 0.5,
    desktopNotifications: false,
};
