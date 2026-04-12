"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { UserSettings, defaultSettings, ThemePreset } from "@ft-transcendence/contracts";
import {
  getLocalSettings,
  setLocalSettings,
  applyAllSettings,
  hexToHSL,
  hslToHex,
} from "@/lib/settings";
import { removeLocalBackground, hasLocalBackground } from "@/lib/file-storage";
import { uploadFile } from "@/lib/upload";
import api from "@/lib/api/api";
import { FontPicker } from "@/components/settings";
import { toast } from "@/components/ui/sonner";

type PresetMeta = {
  label: string;
  accent: string;
  bg: string;
  text: string;
};

const THEME_PRESETS: Record<ThemePreset, PresetMeta> = {
  default:        { label: "Default",        accent: "#e8366d", bg: "#0a0a0a", text: "#f5f5f5" },
  serika_dark:    { label: "Serika Dark",    accent: "#e2b714", bg: "#323437", text: "#d1d0c5" },
  serika:         { label: "Serika",         accent: "#e2b714", bg: "#e1e1e3", text: "#323437" },
  dracula:        { label: "Dracula",        accent: "#bd93f9", bg: "#282a36", text: "#f8f8f2" },
  nord:           { label: "Nord",           accent: "#88c0d0", bg: "#2e3440", text: "#eceff4" },
  monokai:        { label: "Monokai",        accent: "#f92672", bg: "#272822", text: "#f8f8f2" },
  gruvbox_dark:   { label: "Gruvbox Dark",   accent: "#fe8019", bg: "#282828", text: "#ebdbb2" },
  solarized_dark: { label: "Solarized Dark", accent: "#268bd2", bg: "#002b36", text: "#839496" },
  catppuccin:     { label: "Catppuccin",     accent: "#cba6f7", bg: "#1e1e2e", text: "#cdd6f4" },
  tokyo_night:    { label: "Tokyo Night",    accent: "#7aa2f7", bg: "#1a1b26", text: "#a9b1d6" },
  custom:         { label: "Custom",         accent: "#e8366d", bg: "#0a0a0a", text: "#f5f5f5" },
};

const HARMONY_MODES = ["complementary", "analogous", "triadic", "split"] as const;

function computeSecondaryHex(hex: string, harmony: string): string {
  const offsets: Record<string, number> = { complementary: 180, analogous: 30, triadic: 120, split: 150 };
  const offset = offsets[harmony] ?? 180;
  const hsl = hexToHSL(hex);
  const secondaryHue = (hsl.h + offset) % 360;
  return hslToHex(secondaryHue, hsl.s, hsl.l);
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [hasCustomBg, setHasCustomBg] = useState(false);
  const [legacyIndexedOnly, setLegacyIndexedOnly] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const local = getLocalSettings();
    setSettings(local);
    applyAllSettings(local);
    fetchSettings();
  }, []);

  useEffect(() => {
    void (async () => {
      const legacy = await hasLocalBackground();
      const server = Boolean(settings.customBackground?.trim());
      setHasCustomBg(server || legacy);
      setLegacyIndexedOnly(legacy && !server);
    })();
  }, [settings.customBackground]);

  const fetchSettings = async () => {
    try {
      const response = await api.settings.getSettings();
      if (response.status === 200) {
        setSettings(response.body);
        setLocalSettings(response.body);
        applyAllSettings(response.body);
      }
    } catch (_error) {}
  };

  const debounceRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setLocalSettings(updated);
    await applyAllSettings(updated);

    const k = String(key);
    if (debounceRef.current[k]) {
      clearTimeout(debounceRef.current[k]);
    }

    debounceRef.current[k] = setTimeout(async () => {
      setSaving(true);
      try {
        await api.settings.updateSettings({
          body: { [key]: value },
        });
      } catch (_error) {
        toast.error(`Failed to save ${String(key)}`);
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  const updateMultipleSettings = async (updates: Partial<UserSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    setLocalSettings(updated);
    await applyAllSettings(updated);

    if (debounceRef.current["_multi"]) {
      clearTimeout(debounceRef.current["_multi"]);
    }

    debounceRef.current["_multi"] = setTimeout(async () => {
      setSaving(true);
      try {
        await api.settings.updateSettings({ body: updates });
      } catch (_error) {
        toast.error("Failed to save theme");
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  const pickBackgroundFile = () => bgFileRef.current?.click();

  const onBackgroundFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less.");
      return;
    }
    setBgUploading(true);
    try {
      await removeLocalBackground();
      const result = await uploadFile(file);
      await updateSetting("customBackground", result.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBgUploading(false);
    }
  };

  const handleRemoveBackground = async () => {
    await removeLocalBackground();
    const updated = { ...settings, customBackground: null };
    setSettings(updated);
    setLocalSettings(updated);
    await applyAllSettings(updated);
    setHasCustomBg(false);
    setLegacyIndexedOnly(false);
    setSaving(true);
    try {
      await api.settings.updateSettings({ body: { customBackground: null } });
    } catch {
      toast.error("Failed to remove background");
    } finally {
      setSaving(false);
    }
  };

  const selectPreset = (preset: ThemePreset) => {
    if (preset === "custom") {
      updateMultipleSettings({ theme: "custom", customTheme: true });
      return;
    }
    const meta = THEME_PRESETS[preset];
    updateMultipleSettings({
      theme: preset,
      themeColor: meta.accent,
      customTheme: false,
    });
  };

  const secondaryColor = useMemo(
    () => computeSecondaryHex(settings.themeColor, settings.colorHarmony),
    [settings.themeColor, settings.colorHarmony]
  );

  const isPresetMode = !settings.customTheme;
  const activePreset = settings.theme || "default";

  return (
    <div className="page animate-fade-in" style={{ paddingBottom: "4rem" }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "48px",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "300", margin: 0 }}>
          Global Appearance
        </h1>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          {saving && (
            <span style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px", animation: "spin 1s linear infinite" }}>sync</span>
              Saving…
            </span>
          )}
          <div className="glass" style={{
            padding: "8px 16px",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid var(--border-color)",
          }}>
            <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "20px" }}>palette</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>System Persona</span>
          </div>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))", gap: "24px" }}>

        {/* Background & Filters Column */}
        <div className="stack-md">
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>image</span>
              <span className="section-title">CUSTOM BACKGROUND</span>
            </div>

            <p className="section-description" style={{ marginBottom: "24px" }}>
              Personalize your environment with custom images and atmospheric filters.
            </p>

            <div className="stack-md">
              {legacyIndexedOnly ? (
                <p
                  className="section-description"
                  style={{ marginBottom: "12px", fontSize: "13px", color: "var(--text-muted)" }}
                >
                  You have a background stored only on this device. Upload an image to sync it to your account, or remove it.
                </p>
              ) : null}
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  ref={bgFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={onBackgroundFile}
                />
                <button
                  type="button"
                  onClick={pickBackgroundFile}
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: "160px" }}
                  disabled={bgUploading}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", marginRight: "8px" }}>
                    upload
                  </span>
                  {bgUploading ? "Uploading…" : "Upload background image"}
                </button>
                {hasCustomBg ? (
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    className="btn btn-ghost"
                    style={{ color: "var(--destructive-foreground)" }}
                    disabled={saving}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                  </button>
                ) : null}
              </div>

              <div className="button-group" style={{ width: "100%" }}>
                {(["cover", "contain", "max"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSetting("customBackgroundSize", size)}
                    className={`button-group-item ${settings.customBackgroundSize === size ? "active" : ""}`}
                    style={{ flex: 1 }}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>blur_on</span>
              <span className="section-title">ATMOSPHERIC FILTERS</span>
            </div>

            <div className="stack-sm">
              {[
                { label: "BLUR", min: 0, max: 5, step: 0.1, index: 0 },
                { label: "BRIGHTNESS", min: 0, max: 2, step: 0.1, index: 1 },
                { label: "SATURATION", min: 0, max: 2, step: 0.1, index: 2 },
                { label: "OPACITY", min: 0, max: 1, step: 0.1, index: 3 },
              ].map((filter) => (
                <div key={filter.label} className="slider-item">
                  <span className="slider-label">{filter.label}</span>
                  <span className="slider-value">{settings.customBackgroundFilter[filter.index].toFixed(1)}</span>
                  <input
                    type="range"
                    min={filter.min}
                    max={filter.max}
                    step={filter.step}
                    value={settings.customBackgroundFilter[filter.index]}
                    onChange={(e) => {
                      const newFilter = [...settings.customBackgroundFilter] as [number, number, number, number];
                      newFilter[filter.index] = parseFloat(e.target.value);
                      updateSetting("customBackgroundFilter", newFilter);
                    }}
                    className="slider"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Theme & Tokens Column */}
        <div className="stack-md">

          {/* Theme Presets */}
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)", position: "relative", zIndex: 20, overflow: "visible" }}>
            <div className="section-header" style={{ marginBottom: "8px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>token</span>
              <span className="section-title">THEME PRESETS</span>
            </div>
            <p className="section-description" style={{ marginBottom: "20px" }}>
              Choose a preset or go custom. Each preset configures accent colors to match popular themes.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "8px",
              marginBottom: "24px",
            }}>
              {(Object.entries(THEME_PRESETS) as [ThemePreset, PresetMeta][]).map(([key, meta]) => {
                const isActive = activePreset === key && (key === "custom" ? settings.customTheme : !settings.customTheme);
                return (
                  <button
                    key={key}
                    onClick={() => selectPreset(key)}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      padding: "12px 8px",
                      borderRadius: "var(--radius)",
                      border: isActive
                        ? `2px solid ${meta.accent}`
                        : "1px solid var(--border-color)",
                      background: isActive
                        ? `color-mix(in srgb, ${meta.accent} 8%, transparent)`
                        : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {key === "custom" ? (
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "conic-gradient(#f44, #f4f, #44f, #4ff, #4f4, #ff4, #f44)",
                        border: "2px solid var(--border-color)",
                      }} />
                    ) : (
                      <div style={{
                        display: "flex",
                        gap: "3px",
                        height: "32px",
                        alignItems: "center",
                      }}>
                        <div style={{ width: "20px", height: "28px", borderRadius: "4px", background: meta.bg, border: "1px solid rgba(255,255,255,0.06)" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ width: "14px", height: "12px", borderRadius: "3px", background: meta.accent }} />
                          <div style={{ width: "14px", height: "12px", borderRadius: "3px", background: meta.text, opacity: 0.6 }} />
                        </div>
                      </div>
                    )}
                    <span style={{
                      fontSize: "9px",
                      fontWeight: isActive ? "600" : "400",
                      color: isActive ? meta.accent : "var(--text-muted)",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      lineHeight: 1.2,
                      textAlign: "center",
                    }}>
                      {meta.label}
                    </span>
                    {isActive && (
                      <span className="material-symbols-outlined" style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        fontSize: "12px",
                        color: meta.accent,
                      }}>check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="divider" style={{ margin: "0 0 20px 0" }} />

            {/* Color Tuning */}
            {isPresetMode ? (
              <div className="stack-md">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span className="slider-label">CORE ACCENT</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>{settings.themeColor}</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type="color"
                      value={settings.themeColor}
                      onChange={(e) => updateSetting("themeColor", e.target.value)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        border: "3px solid var(--border-color)",
                        background: "none",
                        cursor: "pointer",
                        padding: 0,
                        overflow: "hidden",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>COLOR HARMONY</label>
                  <div className="button-group" style={{ width: "100%" }}>
                    {HARMONY_MODES.map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSetting("colorHarmony", mode)}
                        className={`button-group-item ${settings.colorHarmony === mode ? "active" : ""}`}
                        style={{ flex: 1, fontSize: "0.7rem" }}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "10px", display: "block" }}>CUSTOM COLOR MAP</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { label: "Background", key: "bgPrimary", fallback: "#0a0a0a" },
                    { label: "Accent", key: "accent", fallback: "#e8366d" },
                    { label: "Text", key: "textPrimary", fallback: "#f5f5f5" },
                    { label: "Muted", key: "textSecondary", fallback: "#707070" },
                    { label: "Error", key: "error", fallback: "#f44336" },
                    { label: "Success", key: "success", fallback: "#4caf50" },
                    { label: "Secondary BG", key: "bgSecondary", fallback: "#1a1a1a" },
                    { label: "Accent 2", key: "accentSecondary", fallback: "#36e8b1" },
                  ].map((t) => (
                    <div key={t.key} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border-color)",
                      background: "rgba(255,255,255,0.02)",
                    }}>
                      <input
                        type="color"
                        value={(settings.customThemeColors as Record<string, string>)?.[t.key] || t.fallback}
                        onChange={(e) => {
                          const newColors = { ...(settings.customThemeColors || {}) } as Record<string, string>;
                          newColors[t.key] = e.target.value;
                          updateSetting("customThemeColors", newColors as UserSettings["customThemeColors"]);
                        }}
                        style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid var(--border-color)", background: "none", cursor: "pointer", padding: 0, flexShrink: 0, overflow: "hidden" }}
                      />
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Surface & Typography */}
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)", position: "relative", zIndex: 10 }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>tune</span>
              <span className="section-title">SURFACE & TYPOGRAPHY</span>
            </div>

            <div className="stack-md">
              <div>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>FONT FAMILY</label>
                <FontPicker
                  value={settings.fontFamily}
                  onChange={(font: string) => updateSetting("fontFamily", font as UserSettings["fontFamily"])}
                />
              </div>

              <div className="slider-item">
                <span className="slider-label">RADIUS</span>
                <span className="slider-value">{settings.borderRadius}px</span>
                <input type="range" min="0" max="20" value={settings.borderRadius} onChange={(e) => updateSetting("borderRadius", parseFloat(e.target.value))} className="slider" />
              </div>
              <div className="slider-item">
                <span className="slider-label">GLASS OPACITY</span>
                <span className="slider-value">{Math.round(settings.glassOpacity * 100)}%</span>
                <input type="range" min="0" max="0.5" step="0.01" value={settings.glassOpacity} onChange={(e) => updateSetting("glassOpacity", parseFloat(e.target.value))} className="slider" />
              </div>
              <div className="slider-item">
                <span className="slider-label">GLASS BLUR</span>
                <span className="slider-value">{settings.glassBlur}px</span>
                <input type="range" min="0" max="20" value={settings.glassBlur} onChange={(e) => updateSetting("glassBlur", parseFloat(e.target.value))} className="slider" />
              </div>
            </div>
          </section>

          {/* Live Token Preview */}
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)", position: "relative", zIndex: 5 }}>
            <div className="section-header" style={{ marginBottom: "20px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>visibility</span>
              <span className="section-title">LIVE TOKEN PREVIEW</span>
            </div>

            {/* Gradient strip */}
            <div style={{
              background: `linear-gradient(135deg, ${settings.themeColor} 0%, ${secondaryColor} 100%)`,
              borderRadius: "var(--radius)",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>Prism Engine</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px", marginTop: "2px" }}>
                  {settings.colorHarmony.toUpperCase()} · {settings.themeColor.toUpperCase()}
                </div>
              </div>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
              }} />
            </div>

            {/* Token swatches */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
            }}>
              {[
                { label: "Primary", color: settings.themeColor },
                { label: "Secondary", color: secondaryColor },
                { label: "Destructive", color: "var(--destructive-foreground)" },
              ].map((tok) => (
                <div key={tok.label} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  borderRadius: "var(--radius)",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-color)",
                }}>
                  <div style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    background: tok.color,
                    flexShrink: 0,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }} />
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{tok.label}</span>
                </div>
              ))}
            </div>

            {/* Surface demo */}
            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: "11px" }}>Primary</button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "11px" }}>Secondary</button>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: "11px" }}>Ghost</button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
