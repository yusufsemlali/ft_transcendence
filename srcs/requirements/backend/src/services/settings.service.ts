import { db } from "@/dal/db";
import { userSettings } from "@/dal/db/schemas/settings";
import { eq } from "drizzle-orm";
import { UserSettings, defaultSettings, PartialUserSettings } from "@ft-transcendence/contracts";
import { ApiResponse } from "@/utils/response";
import { FileService } from "./file.service";

export const getSettings = async (userId: string): Promise<ApiResponse<UserSettings>> => {
    const [existing] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));

    if (existing) {
        return new ApiResponse("Settings fetched", mapDbToSettings(existing));
    }

    const [created] = await db
        .insert(userSettings)
        .values({ userId })
        .returning();

    return new ApiResponse("Settings created", mapDbToSettings(created));
};

export const updateSettings = async (
    userId: string,
    updates: PartialUserSettings
): Promise<ApiResponse<UserSettings>> => {
    const oldSettingsObj = await getSettings(userId);
    const oldSettings = oldSettingsObj.data;

    if (updates.customBackground !== undefined && oldSettings) {
        if (oldSettings.customBackground && updates.customBackground !== oldSettings.customBackground) {
            if (oldSettings.customBackground.includes('/uploads/')) {
                console.log("[SETTINGS] Purging old background:", oldSettings.customBackground);
                await FileService.deleteSystemFileByUrl(oldSettings.customBackground);
            }
        }
    }

    const dbUpdates: Record<string, unknown> = {};

    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.customTheme !== undefined) dbUpdates.customTheme = updates.customTheme;
    if (updates.customThemeColors !== undefined) dbUpdates.customThemeColors = updates.customThemeColors;
    if (updates.fontFamily !== undefined) dbUpdates.fontFamily = updates.fontFamily;
    if (updates.fontSize !== undefined) dbUpdates.fontSize = updates.fontSize;
    if (updates.customBackground !== undefined) dbUpdates.customBackground = updates.customBackground;
    if (updates.customBackgroundSize !== undefined) dbUpdates.customBackgroundSize = updates.customBackgroundSize;
    if (updates.customBackgroundFilter !== undefined) dbUpdates.customBackgroundFilter = updates.customBackgroundFilter;
    if (updates.smoothAnimations !== undefined) dbUpdates.smoothAnimations = updates.smoothAnimations;
    if (updates.showKeyboardShortcuts !== undefined) dbUpdates.showKeyboardShortcuts = updates.showKeyboardShortcuts;
    if (updates.compactMode !== undefined) dbUpdates.compactMode = updates.compactMode;
    if (updates.soundEnabled !== undefined) dbUpdates.soundEnabled = updates.soundEnabled;
    if (updates.soundVolume !== undefined) dbUpdates.soundVolume = updates.soundVolume;
    if (updates.desktopNotifications !== undefined) dbUpdates.desktopNotifications = updates.desktopNotifications;
    if (updates.themeMode !== undefined) dbUpdates.themeMode = updates.themeMode;
    if (updates.themeColor !== undefined) dbUpdates.themeColor = updates.themeColor;
    if (updates.colorHarmony !== undefined) dbUpdates.colorHarmony = updates.colorHarmony;
    if (updates.borderRadius !== undefined) dbUpdates.borderRadius = updates.borderRadius;
    if (updates.glassBlur !== undefined) dbUpdates.glassBlur = updates.glassBlur;
    if (updates.glassOpacity !== undefined) dbUpdates.glassOpacity = updates.glassOpacity;

    dbUpdates.updatedAt = new Date();

    const [updated] = await db
        .update(userSettings)
        .set(dbUpdates)
        .where(eq(userSettings.userId, userId))
        .returning();

    return new ApiResponse("Settings updated", mapDbToSettings(updated));
};

export const resetSettings = async (userId: string): Promise<ApiResponse<UserSettings>> => {
    const oldSettingsObj = await getSettings(userId);
    const oldSettings = oldSettingsObj.data;

    if (oldSettings && oldSettings.customBackground) {
        if (oldSettings.customBackground.includes('/uploads/')) {
            console.log("[SETTINGS] Purging background on reset:", oldSettings.customBackground);
            await FileService.deleteSystemFileByUrl(oldSettings.customBackground);
        }
    }
    const [updated] = await db
        .update(userSettings)
        .set({
            theme: defaultSettings.theme,
            customTheme: defaultSettings.customTheme,
            customThemeColors: null,
            fontFamily: defaultSettings.fontFamily,
            fontSize: defaultSettings.fontSize,
            customBackground: defaultSettings.customBackground,
            customBackgroundSize: defaultSettings.customBackgroundSize,
            customBackgroundFilter: defaultSettings.customBackgroundFilter,
            smoothAnimations: defaultSettings.smoothAnimations,
            showKeyboardShortcuts: defaultSettings.showKeyboardShortcuts,
            compactMode: defaultSettings.compactMode,
            soundEnabled: defaultSettings.soundEnabled,
            soundVolume: defaultSettings.soundVolume,
            desktopNotifications: defaultSettings.desktopNotifications,
            themeColor: defaultSettings.themeColor,
            colorHarmony: defaultSettings.colorHarmony,
            borderRadius: defaultSettings.borderRadius,
            glassBlur: defaultSettings.glassBlur,
            glassOpacity: defaultSettings.glassOpacity,
            themeMode: defaultSettings.themeMode,
            updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();

    return new ApiResponse("Settings reset", mapDbToSettings(updated));
};

function mapDbToSettings(row: typeof userSettings.$inferSelect): UserSettings {
    return {
        theme: row.theme as UserSettings["theme"],
        customTheme: row.customTheme,
        customThemeColors: row.customThemeColors as UserSettings["customThemeColors"],
        fontFamily: row.fontFamily as UserSettings["fontFamily"],
        fontSize: row.fontSize,
        customBackground: row.customBackground || "",
        customBackgroundSize: row.customBackgroundSize as UserSettings["customBackgroundSize"],
        customBackgroundFilter: row.customBackgroundFilter as UserSettings["customBackgroundFilter"],
        smoothAnimations: row.smoothAnimations,
        showKeyboardShortcuts: row.showKeyboardShortcuts,
        compactMode: row.compactMode,
        soundEnabled: row.soundEnabled,
        soundVolume: row.soundVolume,
        desktopNotifications: row.desktopNotifications,
        themeMode: row.themeMode as UserSettings["themeMode"],
        themeColor: row.themeColor,
        colorHarmony: row.colorHarmony as UserSettings["colorHarmony"],
        borderRadius: row.borderRadius,
        glassBlur: row.glassBlur,
        glassOpacity: row.glassOpacity,
    };
}
