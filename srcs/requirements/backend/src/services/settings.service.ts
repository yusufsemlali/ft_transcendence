import { db } from "@/dal/db";
import { userSettings } from "@/dal/db/schemas/settings";
import { eq } from "drizzle-orm";
import { UserSettings, defaultSettings, PartialUserSettings } from "@ft-transcendence/contracts";

// Get settings for a user, create defaults if not exists
export const getSettings = async (userId: number): Promise<UserSettings> => {
    const [existing] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));

    if (existing) {
        return mapDbToSettings(existing);
    }

    // Create default settings for user
    const [created] = await db
        .insert(userSettings)
        .values({ userId })
        .returning();

    return mapDbToSettings(created);
};

// Update settings
export const updateSettings = async (
    userId: number,
    updates: PartialUserSettings
): Promise<UserSettings> => {
    // Ensure settings exist
    await getSettings(userId);

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

    dbUpdates.updatedAt = new Date();

    const [updated] = await db
        .update(userSettings)
        .set(dbUpdates)
        .where(eq(userSettings.userId, userId))
        .returning();

    return mapDbToSettings(updated);
};

// Reset to defaults
export const resetSettings = async (userId: number): Promise<UserSettings> => {
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
            updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();

    return mapDbToSettings(updated);
};

// Map DB row to UserSettings type
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
    };
}
