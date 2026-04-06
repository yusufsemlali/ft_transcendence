/**
 * Generates a URL-friendly slug from a name and appends a unique suffix 
 * to prevent collisions across different contexts (e.g., different organizations).
 * 
 * @param name The display name to slugify (e.g., "Winter Cup 2026")
 * @param contextId An optional unique ID (like an Organization UUID) to use as a suffix source
 * @returns A slug like "winter-cup-2026-6e3dea2d"
 */

export const generateUniqueSlug = (name: string, contextId?: string): string => {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (!contextId) return baseSlug;

    const suffix = contextId.split('-')[0];
    return `${baseSlug}-${suffix}`;
};

export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};
