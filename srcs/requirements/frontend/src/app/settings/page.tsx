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
import { toast } from "@/components/ui/sonner";


export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [hasLocalBg, setHasLocalBg] = useState(false);

  useEffect(() => {
    const local = getLocalSettings();
    setSettings(local);
    applyAllSettings(local);
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
        applyAllSettings(response.body);
      }
    } catch (error) {}
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
        toast.success("Local background image set");
      },
      (error) => {
        toast.error(error);
      },
    );
  };

  const handleRemoveLocalImage = async () => {
    await removeLocalBackground();
    setHasLocalBg(false);
    await applyAllSettings(settings);
    toast.success("Local background removed");
  };

  return (
    <div className="page animate-fade-in" style={{ paddingBottom: "4rem" }}>
      {/* Persona Header */}
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
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))", gap: "24px" }}>
        
        {/* Background & Filters Card */}
        <div className="stack-md">
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-info)" }}>image</span>
              <span className="section-title">CUSTOM BACKGROUND</span>
            </div>
            
            <p className="section-description" style={{ marginBottom: "24px" }}>
              Personalize your environment with custom images and atmospheric filters.
            </p>

            <div className="stack-md">
               <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={handleLocalImageUpload} className="btn btn-secondary" style={{ flex: 1 }}>
                     <span className="material-symbols-outlined" style={{ fontSize: "16px", marginRight: "8px" }}>upload</span>
                     LOCAL IMAGE
                  </button>
                  {hasLocalBg && (
                    <button onClick={handleRemoveLocalImage} className="btn btn-ghost" style={{ color: "var(--accent-error)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                    </button>
                  )}
               </div>

               <div className="divider">OR</div>

               <div>
                 <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>IMAGE URL</label>
                 <input
                   type="url"
                   value={settings.customBackground || ""}
                   onChange={(e) => updateSetting("customBackground", e.target.value || null)}
                   placeholder="https://example.com/bg.jpg"
                   className="input"
                 />
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
              <span className="material-symbols-outlined" style={{ color: "var(--accent-secondary)" }}>blur_on</span>
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

        {/* Theme & Tokens Card */}
        <div className="stack-md">
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)", position: "relative", zIndex: 20, overflow: "visible" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>token</span>
              <span className="section-title">THEME TOKENS</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
               <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Custom Engine</span>
               <div className="button-group">
                  <button onClick={() => updateSetting("customTheme", false)} className={`button-group-item ${!settings.customTheme ? "active" : ""}`}>PRESET</button>
                  <button onClick={() => updateSetting("customTheme", true)} className={`button-group-item ${settings.customTheme ? "active" : ""}`}>ADVANCED</button>
               </div>
            </div>

            {!settings.customTheme ? (
              <div className="stack-md">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <span className="slider-label">CORE ACCENT</span>
                   <input
                     type="color"
                     value={settings.themeColor}
                     onChange={(e) => updateSetting("themeColor", e.target.value)}
                     style={{ width: "40px", height: "40px", borderRadius: "8px", border: "2px solid var(--border-color)", background: "none", cursor: "pointer", padding: 0, overflow: "hidden" }}
                   />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>COLOR HARMONY</label>
                  <div className="button-group" style={{ width: "100%" }}>
                    {(["complementary", "analogous", "triadic", "split"] as const).map((mode) => (
                      <button key={mode} onClick={() => updateSetting("colorHarmony", mode)} className={`button-group-item ${settings.colorHarmony === mode ? "active" : ""}`} style={{ flex: 1 }}>{mode.toUpperCase()}</button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                 {[
                   { label: "BG", key: "bgPrimary" },
                   { label: "ACCENT", key: "accent" },
                   { label: "TEXT", key: "textPrimary" },
                   { label: "MUTED", key: "textSecondary" },
                 ].map((t) => (
                   <div key={t.key} style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>{t.label}</div>
                      <input 
                        type="color" 
                        value={(settings.customThemeColors as any)?.[t.key] || "#000000"} 
                        onChange={(e) => {
                          const newColors = { ...settings.customThemeColors } as any;
                          newColors[t.key] = e.target.value;
                          updateSetting("customThemeColors", newColors);
                        }}
                        style={{ width: "100%", height: "24px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer" }} 
                      />
                   </div>
                 ))}
              </div>
            )}

            <div className="divider" style={{ margin: "24px 0" }}></div>

            <div className="stack-md">
                   <div>
                      <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>TYPOGRAPHY</label>
                      <FontPicker
                        value={settings.fontFamily}
                        onChange={(font) => updateSetting("fontFamily", font as any)}
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
            </div>
          </section>

          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)", position: "relative", zIndex: 10 }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-warning)" }}>visibility</span>
              <span className="section-title">THEME PREVIEW</span>
            </div>
            
            <div style={{ background: "var(--gradient-prism)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "white" }}>PRISM CORE</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", letterSpacing: "1px" }}>ACTIVE TOKENS: {settings.colorHarmony.toUpperCase()}</div>
               </div>
               <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
