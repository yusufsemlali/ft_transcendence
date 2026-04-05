"use client";

import { useState, useEffect, useRef } from "react";
import { UserSettings, defaultSettings } from "@ft-transcendence/contracts";
import {
  getLocalSettings,
  setLocalSettings,
  applyAllSettings,
} from "@/lib/settings";
import {
  handleImageUpload,
  setLocalBackground,
  removeLocalBackground,
  hasLocalBackground,
} from "@/lib/file-storage";
import api from "@/lib/api/api";
import { FontPicker } from "@/components/settings";


export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [saving, setSaving] = useState(false);
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const [hasLocalBg, setHasLocalBg] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const local = getLocalSettings();
    setSettings(local);
    applyAllSettings(local); // Immediate application
    checkLocalBackground();

    fetchSettings();
  }, []);

  const checkLocalBackground = async () => {
    const has = await hasLocalBackground();
    setHasLocalBg(has);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.settings.getSettings();
      if (response.status === 200) {
        setSettings(response.body);
        setLocalSettings(response.body);
        applyAllSettings(response.body); // Sync with server state
      }
    } catch (error) {
      console.log("Failed to fetch settings:", error);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
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

    // Debounce API calls per key
    if (debounceRef.current[key]) {
      clearTimeout(debounceRef.current[key]);
    }

    debounceRef.current[key] = setTimeout(async () => {
      setSaving(true);
      try {
        await api.settings.updateSettings({
          body: { [key]: value },
        });
      } catch (error) {
        console.log("Failed to save setting:", error);
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  const handleLocalImageUpload = () => {
    handleImageUpload(
      async (dataUrl) => {
        await setLocalBackground(dataUrl);
        setHasLocalBg(true);
        await applyAllSettings(settings);
        showNotification("success", "Local background image set");
      },
      (error) => {
        showNotification("error", error);
      },
    );
  };

  const handleRemoveLocalImage = async () => {
    await removeLocalBackground();
    setHasLocalBg(false);
    await applyAllSettings(settings);
    showNotification("success", "Local background removed");
  };

  return (
    <>
      {/* Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            fontSize: "0.8rem",
            zIndex: 100,
            background:
              notification.type === "success"
                ? "var(--accent-success)"
                : "var(--accent-error)",
            color: "var(--bg-primary)",
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Settings content */}
      <div className="page animate-fade-in">
        {/* Custom Background Section */}
        <section className="section">
          <div className="section-header">
            <svg
              className="section-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="section-title">custom background</span>
            <svg
              className="section-edit"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <p className="section-description">
            Set an image url or local image to be a custom background image.
            Local image always take priority over the image url. Cover fits the
            image to cover the screen. Contain fits the image to be fully
            visible. Max fits the image corner to corner.
          </p>

          <div className="settings-row">
            <div className="settings-main">
              <p className="section-note">
                Note: The local image is stored in your browser&apos;s local
                storage and will not be uploaded to the server. This means that
                if you clear your browser&apos;s local storage or use a
                different browser, the local image will be lost.
              </p>
            </div>
            <div className="settings-side">
              {hasLocalBg ? (
                <button
                  onClick={handleRemoveLocalImage}
                  className="btn btn-secondary"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  remove local image
                </button>
              ) : (
                <button
                  onClick={handleLocalImageUpload}
                  className="btn btn-secondary"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  use local image
                </button>
              )}
              <div className="divider">or</div>
              <input
                type="url"
                value={settings.customBackground || ""}
                onChange={(e) =>
                  updateSetting("customBackground", e.target.value || null)
                }
                placeholder="https://example.com/image.jpg"
                className="input"
                style={{ width: "300px" }}
              />
              <div className="button-group">
                {(["cover", "contain", "max"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSetting("customBackgroundSize", size)}
                    className={`button-group-item ${settings.customBackgroundSize === size ? "active" : ""}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Custom Background Filter Section */}
        <section className="section">
          <div className="section-header">
            <svg
              className="section-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span className="section-title">custom background filter</span>
            <svg
              className="section-edit"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <p className="section-description">
            Apply various effects to the custom background.
          </p>

          <div className="slider-row">
            <div className="slider-item">
              <span className="slider-label">blur</span>
              <span className="slider-value">
                {settings.customBackgroundFilter[0].toFixed(1)}
              </span>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={settings.customBackgroundFilter[0]}
                onChange={(e) => {
                  const newFilter = [...settings.customBackgroundFilter] as [
                    number,
                    number,
                    number,
                    number,
                  ];
                  newFilter[0] = parseFloat(e.target.value);
                  updateSetting("customBackgroundFilter", newFilter);
                }}
                className="slider"
              />
            </div>
            <div className="slider-item">
              <span className="slider-label">brightness</span>
              <span className="slider-value">
                {settings.customBackgroundFilter[1].toFixed(1)}
              </span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.customBackgroundFilter[1]}
                onChange={(e) => {
                  const newFilter = [...settings.customBackgroundFilter] as [
                    number,
                    number,
                    number,
                    number,
                  ];
                  newFilter[1] = parseFloat(e.target.value);
                  updateSetting("customBackgroundFilter", newFilter);
                }}
                className="slider"
              />
            </div>
          </div>

          <div className="slider-row">
            <div className="slider-item">
              <span className="slider-label">saturate</span>
              <span className="slider-value">
                {settings.customBackgroundFilter[2].toFixed(1)}
              </span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.customBackgroundFilter[2]}
                onChange={(e) => {
                  const newFilter = [...settings.customBackgroundFilter] as [
                    number,
                    number,
                    number,
                    number,
                  ];
                  newFilter[2] = parseFloat(e.target.value);
                  updateSetting("customBackgroundFilter", newFilter);
                }}
                className="slider"
              />
            </div>
            <div className="slider-item">
              <span className="slider-label">opacity</span>
              <span className="slider-value">
                {settings.customBackgroundFilter[3].toFixed(1)}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.customBackgroundFilter[3]}
                onChange={(e) => {
                  const newFilter = [...settings.customBackgroundFilter] as [
                    number,
                    number,
                    number,
                    number,
                  ];
                  newFilter[3] = parseFloat(e.target.value);
                  updateSetting("customBackgroundFilter", newFilter);
                }}
                className="slider"
              />
            </div>
          </div>
        </section>


        {/* Theme Customization Section */}
        <section className="section">
          <div className="section-header">
            <svg
              className="section-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.828 2.828a2 2 0 010 2.828l-8.486 8.486L5 21l8.486-8.486M7 14.343l8.486-8.486"
              />
            </svg>
            <span className="section-title">theme tokens</span>
          </div>
          {/* Header & Mode Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <p className="section-description" style={{ margin: 0 }}>
              Customize the core design tokens of the application.
            </p>
            <div className="button-group">
              <button
                onClick={() => updateSetting("customTheme", false)}
                className={`button-group-item ${!settings.customTheme ? "active" : ""}`}
              >
                preset
              </button>
              <button
                onClick={() => updateSetting("customTheme", true)}
                className={`button-group-item ${settings.customTheme ? "active" : ""}`}
                style={settings.customTheme ? { background: "var(--theme-color)", color: "var(--background)" } : {}}
              >
                custom
              </button>
            </div>
          </div>

          {!settings.customTheme ? (
            <>
              {/* Primary color + Harmony row */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <span className="slider-label" style={{ minWidth: "auto" }}>primary</span>
                <input
                  type="color"
                  value={settings.themeColor}
                  onChange={(e) => updateSetting("themeColor", e.target.value)}
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "2px solid var(--border-color)",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                  }}
                />
                <div style={{ width: "1px", height: "20px", background: "var(--border-color)" }} />
                <span className="slider-label" style={{ minWidth: "auto" }}>harmony</span>
                <div className="button-group">
                  {(["complementary", "analogous", "triadic", "split"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updateSetting("colorHarmony", mode)}
                      className={`button-group-item ${settings.colorHarmony === mode ? "active" : ""}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color preview dots */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: "var(--theme-color)",
                    }}
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>primary</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: "var(--theme-color-secondary)",
                    }}
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>secondary</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { label: "background", key: "bgPrimary" as const, default: "#0a0a0a" },
                { label: "main", key: "accent" as const, default: "#e8366d" },
                { label: "caret", key: "accentSecondary" as const, default: "#36e8b1" },
                { label: "error", key: "error" as const, default: "#ca4754" },
                { label: "sub alt", key: "bgSecondary" as const, default: "#2c2e31" },
                { label: "sub", key: "textSecondary" as const, default: "#646669" },
                { label: "text", key: "textPrimary" as const, default: "#d1d0c5" },
                { label: "extra error", key: "bgTertiary" as const, default: "#7e2a33" }, // Mapped closely
              ].map(({ label, key, default: defHex }) => {
                const colors = settings.customThemeColors || {} as any;
                const value = colors[key] || defHex;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)", padding: "0.5rem 1rem", borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", minWidth: "100px" }}>{label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--background)", padding: "0.25rem 0.5rem", borderRadius: "calc(var(--radius) - 2px)", width: "100%" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)", flex: 1 }}>{value}</span>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => {
                          const newColors = { ...settings.customThemeColors } as any;
                          newColors[key] = e.target.value;
                          
                          // If initializing for the first time, populate all defaults
                          if (!settings.customThemeColors) {
                            newColors.bgPrimary = "#0a0a0a";
                            newColors.accent = "#e8366d";
                            newColors.accentSecondary = "#36e8b1";
                            newColors.error = "#ca4754";
                            newColors.bgSecondary = "#2c2e31";
                            newColors.textSecondary = "#646669";
                            newColors.textPrimary = "#d1d0c5";
                            newColors.bgTertiary = "#7e2a33";
                            newColors.success = "#36e8b1";
                            newColors.textMuted = "#646669";
                            newColors[key] = e.target.value; // override the specific one changed
                          }
                          updateSetting("customThemeColors", newColors);
                        }}
                        style={{
                          width: "24px",
                          height: "24px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Radius + Glass slider */}
          <div className="slider-row">
            <div className="slider-item">
              <span className="slider-label">radius</span>
              <span className="slider-value">{settings.borderRadius}px</span>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.borderRadius}
                onChange={(e) =>
                  updateSetting("borderRadius", parseFloat(e.target.value))
                }
                className="slider"
              />
            </div>
            <div className="slider-item">
              <span className="slider-label">glass opacity</span>
              <span className="slider-value">
                {Math.round(settings.glassOpacity * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={settings.glassOpacity}
                onChange={(e) =>
                  updateSetting("glassOpacity", parseFloat(e.target.value))
                }
                className="slider"
              />
            </div>
          </div>
        </section>

        {/* Theme Preview Section */}
        <section className="section">
          <div className="section-header">
            <svg
              className="section-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="section-title">theme preview</span>
          </div>
          <p className="section-description">
            A live preview of your design tokens — see how primary, secondary,
            and harmony colors interact across UI components.
          </p>

          <div
            className="glass-card"
            style={{
              padding: "2rem",
              marginTop: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              background:
                "linear-gradient(135deg, oklch(100% 0 0 / var(--glass-opacity)) 0%, oklch(100% 0 0 / calc(var(--glass-opacity) / 2)) 100%)",
            }}
          >
            {/* Gradient Banner */}
            <div
              style={{
                borderRadius: "var(--radius)",
                padding: "1.25rem 1.5rem",
                background: "var(--gradient-prism)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "white" }}>
                  Gradient Prism
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", marginTop: "0.15rem" }}>
                  Primary → Secondary flow
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    border: "2px solid rgba(255,255,255,0.4)",
                  }}
                />
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--accent-secondary)",
                    border: "2px solid rgba(255,255,255,0.4)",
                  }}
                />
              </div>
            </div>

            {/* Color Swatch Row */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {[
                { label: "primary", bg: "var(--primary)", fg: "white" },
                { label: "secondary", bg: "var(--accent-secondary)", fg: "white" },
                { label: "accent", bg: "var(--accent)", fg: "var(--accent-foreground)" },
                { label: "surface", bg: "var(--secondary)", fg: "var(--secondary-foreground)" },
                { label: "ring", bg: "var(--ring)", fg: "white" },
                { label: "destructive", bg: "var(--destructive)", fg: "var(--destructive-foreground)" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "var(--radius)",
                    background: s.bg,
                    color: s.fg,
                    fontSize: "0.7rem",
                    fontFamily: "var(--font-mono)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {/* Buttons + Badge row */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-secondary">Secondary</button>
              <button className="btn btn-ghost">Ghost</button>
              <div
                style={{
                  padding: "0.2rem 0.6rem",
                  background: "var(--accent)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.7rem",
                  color: "var(--accent-foreground)",
                  border: "1px solid var(--primary)",
                }}
              >
                Badge
              </div>
              <span className="text-gradient" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                Gradient Text
              </span>
            </div>

            {/* Two-column: Input + Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {/* Left: Form elements */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Interactive Elements</span>
                <input
                  className="input"
                  placeholder="Focus to see the ring color..."
                  readOnly
                />
                {/* Progress bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--secondary)",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "72%",
                        background: "var(--primary)",
                        borderRadius: "999px",
                        transition: "all 0.3s",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--secondary)",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "45%",
                        background: "var(--accent-secondary)",
                        borderRadius: "999px",
                        transition: "all 0.3s",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Stat cards */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[
                  { value: "1,247", label: "Matches", color: "var(--primary)" },
                  { value: "89%", label: "Win Rate", color: "var(--accent-secondary)" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      borderRadius: "var(--radius)",
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 300,
                        color: stat.color,
                        lineHeight: 1,
                        transition: "color 0.3s",
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--text-muted)",
                        marginTop: "0.25rem",
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div
              style={{
                padding: "1rem",
                borderRadius: "var(--radius)",
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                fontSize: "0.8rem",
                lineHeight: "1.5",
              }}
            >
              <p style={{ color: "var(--text-secondary)" }}>
                Your{" "}
                <strong style={{ color: "var(--primary)" }}>primary</strong> and{" "}
                <strong style={{ color: "var(--accent-secondary)" }}>
                  secondary
                </strong>{" "}
                colors are linked by{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {settings.colorHarmony}
                </strong>{" "}
                harmony. Adjust the hue and harmony mode above to see every
                element update in real-time.
              </p>
            </div>
          </div>
        </section>

        {/* Font Section */}
        <section className="section">
          <div className="section-header">
            <svg
              className="section-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            <span className="section-title">font family</span>
          </div>
          <p className="section-description">
            Choose the font family used throughout the application. Select from
            over 30 bundled high-quality fonts.
          </p>

          <div style={{ maxWidth: "400px" }}>
            <FontPicker
              value={settings.fontFamily}
              onChange={(fontId) =>
                updateSetting(
                  "fontFamily",
                  fontId as UserSettings["fontFamily"],
                )
              }
            />
          </div>
        </section>

        {/* Sound Section */}
        <section className="section">
          <div className="section-header">
            <svg
              className="section-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
            <span className="section-title">sound</span>
          </div>
          <p className="section-description">
            Enable or disable sound effects.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div className="toggle-group">
              <button
                onClick={() => updateSetting("soundEnabled", false)}
                className={`toggle-item ${!settings.soundEnabled ? "active" : ""}`}
              >
                off
              </button>
              <button
                onClick={() => updateSetting("soundEnabled", true)}
                className={`toggle-item ${settings.soundEnabled ? "active" : ""}`}
              >
                on
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="slider-item" style={{ flex: 1 }}>
                <span className="slider-label">volume</span>
                <span className="slider-value">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) =>
                    updateSetting("soundVolume", parseFloat(e.target.value))
                  }
                  className="slider"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
