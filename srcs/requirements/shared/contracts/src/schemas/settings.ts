import { z } from "zod";

export const CustomBackgroundSizeSchema = z.enum(["cover", "contain", "max"]);
export type CustomBackgroundSize = z.infer<typeof CustomBackgroundSizeSchema>;

export const CustomBackgroundFilterSchema = z.tuple([
    z.number().min(0).max(10),
    z.number().min(0).max(2),
    z.number().min(0).max(2),
    z.number().min(0).max(1),
]);
export type CustomBackgroundFilter = z.infer<typeof CustomBackgroundFilterSchema>;

export const CustomBackgroundSchema = z
    .string()
    .regex(/^[^`'"]*$/)
    .max(2048)
    .nullable();
export type CustomBackground = z.infer<typeof CustomBackgroundSchema>;

export const ColorHexSchema = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
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

export const FontFamilySchema = z.enum([
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
    "boon",
    "gallaudet",
    "lalezar",
    "noto_naskh_arabic",
    "vazirmatn",
    "coming_soon",
    "itim",
]);
export type FontFamily = z.infer<typeof FontFamilySchema>;

export const FontSizeSchema = z.number().min(0.5).max(3);
export type FontSize = z.infer<typeof FontSizeSchema>;

export const ColorHarmonySchema = z.enum(["complementary", "analogous", "triadic", "split"]);
export type ColorHarmony = z.infer<typeof ColorHarmonySchema>;

export const UserSettingsSchema = z.object({
    theme: ThemePresetSchema.default("default"),
    customTheme: z.boolean().default(false),
    customThemeColors: ThemeColorsSchema.optional().nullable(),
    fontFamily: FontFamilySchema.default("roboto_mono"),
    fontSize: FontSizeSchema.default(1),
    customBackground: CustomBackgroundSchema.nullable().default(null),
    customBackgroundSize: CustomBackgroundSizeSchema.default("cover"),
    customBackgroundFilter: CustomBackgroundFilterSchema.default([0.5, 0.2, 2.0, 1.0]),
    smoothAnimations: z.boolean().default(true),
    showKeyboardShortcuts: z.boolean().default(true),
    compactMode: z.boolean().default(false),
    themeMode: z.enum(["light", "dark", "system"]).default("system"),
    soundEnabled: z.boolean().default(true),
    soundVolume: z.number().min(0).max(1).default(0.5),
    desktopNotifications: z.boolean().default(false),
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/i).default("#9c596eff"),
    colorHarmony: ColorHarmonySchema.default("complementary"),
    borderRadius: z.number().min(0).max(20).default(10),
    glassBlur: z.number().min(0).max(20).default(12),
    glassOpacity: z.number().min(0).max(1).default(0.1),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const PartialUserSettingsSchema = UserSettingsSchema.partial().strict();
export type PartialUserSettings = z.infer<typeof PartialUserSettingsSchema>;

export const defaultSettings: UserSettings = {
    theme: "default",
    customTheme: false,
    customThemeColors: null,
    fontFamily: "roboto_mono",
    fontSize: 1,
    customBackground: null,
    customBackgroundSize: "cover",
    customBackgroundFilter: [0.5, 0.2, 2.0, 1.0],
    smoothAnimations: true,
    showKeyboardShortcuts: true,
    compactMode: false,
    themeMode: "system",
    soundEnabled: true,
    soundVolume: 0.5,
    desktopNotifications: false,
    themeColor: "#e8366d",
    colorHarmony: "complementary",
    borderRadius: 10,
    glassBlur: 12,
    glassOpacity: 0.1,
};
