import { pgTable, serial, integer, varchar, jsonb, boolean, real, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// User settings table - stores all customization preferences
export const userSettings = pgTable('user_settings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull().unique(),

    // Theme
    theme: varchar('theme', { length: 50 }).default('default').notNull(),
    customTheme: boolean('custom_theme').default(false).notNull(),
    customThemeColors: jsonb('custom_theme_colors'),

    // Font
    fontFamily: varchar('font_family', { length: 50 }).default('roboto_mono').notNull(),
    fontSize: real('font_size').default(1).notNull(),

    // Custom background - null by default, only set when user adds one
    customBackground: varchar('custom_background', { length: 2048 }), // null = no background
    customBackgroundSize: varchar('custom_background_size', { length: 20 }).default('cover'),
    // Filters: [blur, brightness, saturate, opacity] - matching Monkeytype defaults
    customBackgroundFilter: jsonb('custom_background_filter').default([0.5, 0.2, 2.0, 1.0]).notNull(),

    // UI preferences
    smoothAnimations: boolean('smooth_animations').default(true).notNull(),
    showKeyboardShortcuts: boolean('show_keyboard_shortcuts').default(true).notNull(),
    compactMode: boolean('compact_mode').default(false).notNull(),

    // Auto switch theme
    autoSwitchTheme: boolean('auto_switch_theme').default(false).notNull(),

    // Sound
    soundEnabled: boolean('sound_enabled').default(true).notNull(),
    soundVolume: real('sound_volume').default(0.5).notNull(),
    desktopNotifications: boolean('desktop_notifications').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
