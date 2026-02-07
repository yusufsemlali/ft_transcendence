"use client";

/**
 * Font Picker Component
 *
 * A dropdown component for selecting fonts from the bundled webfonts.
 * Shows font names rendered in their own font for preview.
 */

import { useState, useMemo } from "react";
import {
  FONT_LIST,
  getFontById,
  applyFont,
  type FontDefinition,
} from "@/lib/fonts";
import styles from "./FontPicker.module.css";

interface FontPickerProps {
  /** Currently selected font ID */
  value: string;
  /** Callback when font is selected */
  onChange: (fontId: string) => void;
  /** Optional: filter by category */
  category?: FontDefinition["category"];
  /** Optional: show category labels */
  showCategories?: boolean;
  /** Optional: disabled state */
  disabled?: boolean;
}

export function FontPicker({
  value,
  onChange,
  category,
  showCategories = true,
  disabled = false,
}: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter fonts based on category and search
  const filteredFonts = useMemo(() => {
    let fonts = FONT_LIST;

    if (category) {
      fonts = fonts.filter((f) => f.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      fonts = fonts.filter(
        (f) =>
          f.displayName.toLowerCase().includes(searchLower) ||
          f.id.toLowerCase().includes(searchLower),
      );
    }

    return fonts;
  }, [category, search]);

  // Group fonts by category for display
  const groupedFonts = useMemo(() => {
    if (!showCategories || category) {
      return { all: filteredFonts };
    }

    const groups: Record<string, FontDefinition[]> = {};
    filteredFonts.forEach((font) => {
      if (!groups[font.category]) {
        groups[font.category] = [];
      }
      groups[font.category].push(font);
    });

    return groups;
  }, [filteredFonts, showCategories, category]);

  const selectedFont = getFontById(value);

  const handleSelect = (fontId: string) => {
    onChange(fontId);
    applyFont(fontId); // Apply immediately for preview
    setIsOpen(false);
    setSearch("");
  };

  const categoryLabels: Record<string, string> = {
    monospace: "Monospace",
    "sans-serif": "Sans-Serif",
    serif: "Serif",
    display: "Display",
    handwriting: "Handwriting",
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{ fontFamily: selectedFont?.fontFamily }}
      >
        <span className={styles.selectedName}>
          {selectedFont?.displayName || "Select font..."}
        </span>
        <span className={styles.arrow}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <input
            type="text"
            className={styles.search}
            placeholder="Search fonts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <div className={styles.list}>
            {Object.entries(groupedFonts).map(([categoryKey, fonts]) => (
              <div key={categoryKey}>
                {showCategories && categoryKey !== "all" && (
                  <div className={styles.categoryLabel}>
                    {categoryLabels[categoryKey] || categoryKey}
                  </div>
                )}

                {fonts.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    className={`${styles.option} ${font.id === value ? styles.selected : ""}`}
                    onClick={() => handleSelect(font.id)}
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.displayName}
                  </button>
                ))}
              </div>
            ))}

            {filteredFonts.length === 0 && (
              <div className={styles.noResults}>No fonts found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FontPicker;
