"use client";

import { useState, useEffect } from "react";
import { UserSettings, defaultSettings } from "@ft-transcendence/contracts";
import { getLocalSettings, setLocalSettings, applyAllSettings } from "@/lib/settings";
import { handleImageUpload, setLocalBackground, removeLocalBackground, hasLocalBackground } from "@/lib/file-storage";
import { api } from "@/lib/api";
export default function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [saving, setSaving] = useState(false);
    const [hasLocalBg, setHasLocalBg] = useState(false);
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        const local = getLocalSettings();
        setSettings(local);
        checkLocalBackground();

        const token = localStorage.getItem("token");
        if (token) {
            fetchSettings();
        }
    }, []);

    const checkLocalBackground = async () => {
        const has = await hasLocalBackground();
        setHasLocalBg(has);
    };

    const fetchSettings = async () => {
        try {
            const response = await api.settings.getSettings({
                extraHeaders: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.status === 200) {
                setSettings(response.body);
                setLocalSettings(response.body);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        }
    };

    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const updateSetting = async <K extends keyof UserSettings>(
        key: K,
        value: UserSettings[K]
    ) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        setLocalSettings(updated);
        await applyAllSettings(updated);

        const token = localStorage.getItem("token");
        if (token) {
            setSaving(true);
            try {
                await api.settings.updateSettings({
                    body: { [key]: value },
                    extraHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (error) {
                console.error("Failed to save setting:", error);
            } finally {
                setSaving(false);
            }
        }
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
            }
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
                        background: notification.type === "success" ? "var(--accent-success)" : "var(--accent-error)",
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
                        <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="section-title">custom background</span>
                        <svg className="section-edit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                    <p className="section-description">
                        Set an image url or local image to be a custom background image. Local image always take priority over the image url. Cover fits the image to cover the screen. Contain fits the image to be fully visible. Max fits the image corner to corner.
                    </p>

                    <div className="settings-row">
                        <div className="settings-main">
                            <p className="section-note">
                                Note: The local image is stored in your browser's local storage and will not be uploaded to the server. This means that if you clear your browser's local storage or use a different browser, the local image will be lost.
                            </p>
                        </div>
                        <div className="settings-side">
                            {hasLocalBg ? (
                                <button onClick={handleRemoveLocalImage} className="btn btn-secondary">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    remove local image
                                </button>
                            ) : (
                                <button onClick={handleLocalImageUpload} className="btn btn-secondary">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    use local image
                                </button>
                            )}
                            <div className="divider">or</div>
                            <input
                                type="url"
                                value={settings.customBackground || ""}
                                onChange={(e) => updateSetting("customBackground", e.target.value || null)}
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
                        <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span className="section-title">custom background filter</span>
                        <svg className="section-edit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                    <p className="section-description">
                        Apply various effects to the custom background.
                    </p>

                    <div className="slider-row">
                        <div className="slider-item">
                            <span className="slider-label">blur</span>
                            <span className="slider-value">{settings.customBackgroundFilter[0].toFixed(1)}</span>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={settings.customBackgroundFilter[0]}
                                onChange={(e) => {
                                    const newFilter = [...settings.customBackgroundFilter] as [number, number, number, number];
                                    newFilter[0] = parseFloat(e.target.value);
                                    updateSetting("customBackgroundFilter", newFilter);
                                }}
                                className="slider"
                            />
                        </div>
                        <div className="slider-item">
                            <span className="slider-label">brightness</span>
                            <span className="slider-value">{settings.customBackgroundFilter[1].toFixed(1)}</span>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={settings.customBackgroundFilter[1]}
                                onChange={(e) => {
                                    const newFilter = [...settings.customBackgroundFilter] as [number, number, number, number];
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
                            <span className="slider-value">{settings.customBackgroundFilter[2].toFixed(1)}</span>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={settings.customBackgroundFilter[2]}
                                onChange={(e) => {
                                    const newFilter = [...settings.customBackgroundFilter] as [number, number, number, number];
                                    newFilter[2] = parseFloat(e.target.value);
                                    updateSetting("customBackgroundFilter", newFilter);
                                }}
                                className="slider"
                            />
                        </div>
                        <div className="slider-item">
                            <span className="slider-label">opacity</span>
                            <span className="slider-value">{settings.customBackgroundFilter[3].toFixed(1)}</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.customBackgroundFilter[3]}
                                onChange={(e) => {
                                    const newFilter = [...settings.customBackgroundFilter] as [number, number, number, number];
                                    newFilter[3] = parseFloat(e.target.value);
                                    updateSetting("customBackgroundFilter", newFilter);
                                }}
                                className="slider"
                            />
                        </div>
                    </div>
                </section>

                {/* Auto Switch Theme Section */}
                <section className="section">
                    <div className="section-header">
                        <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span className="section-title">auto switch theme</span>
                    </div>
                    <p className="section-description">
                        Enabling this will automatically switch the theme between light and dark depending on the system theme.
                    </p>

                    <div className="toggle-group">
                        <button
                            onClick={() => updateSetting("autoSwitchTheme", false)}
                            className={`toggle-item ${!settings.autoSwitchTheme ? "active" : ""}`}
                        >
                            off
                        </button>
                        <button
                            onClick={() => updateSetting("autoSwitchTheme", true)}
                            className={`toggle-item ${settings.autoSwitchTheme ? "active" : ""}`}
                        >
                            on
                        </button>
                    </div>
                </section>

                {/* Font Section */}
                <section className="section">
                    <div className="section-header">
                        <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        <span className="section-title">font family</span>
                    </div>
                    <p className="section-description">
                        Choose the font family used throughout the application.
                    </p>

                    <div className="button-group">
                        {["roboto_mono", "fira_code", "jetbrains_mono", "source_code_pro", "inconsolata"].map((font) => (
                            <button
                                key={font}
                                onClick={() => updateSetting("fontFamily", font as UserSettings["fontFamily"])}
                                className={`button-group-item ${settings.fontFamily === font ? "active" : ""}`}
                            >
                                {font.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Sound Section */}
                <section className="section">
                    <div className="section-header">
                        <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
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
                                <span className="slider-value">{Math.round(settings.soundVolume * 100)}%</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={settings.soundVolume}
                                    onChange={(e) => updateSetting("soundVolume", parseFloat(e.target.value))}
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
