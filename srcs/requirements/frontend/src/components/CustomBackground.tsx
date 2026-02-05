"use client";

import { useEffect, useState } from "react";
import { UserSettings, defaultSettings } from "@ft-transcendence/contracts";
import { getLocalSettings, setLocalSettings, getEffectiveBackground } from "@/lib/settings";
import { api } from "@/lib/api";

export function CustomBackground() {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [backgroundSrc, setBackgroundSrc] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        // Load local settings immediately for fast render
        const local = getLocalSettings();
        setSettings(local);
        loadBackground(local);

        // Then try to fetch from API if authenticated
        const token = localStorage.getItem("token");
        if (token) {
            fetchSettings();
        }
    }, []);

    const loadBackground = async (settingsToUse: UserSettings) => {
        const bg = await getEffectiveBackground(settingsToUse);
        setBackgroundSrc(bg);
    };

    const fetchSettings = async () => {
        try {
            const response = await api.settings.getSettings({
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.status === 200) {
                setSettings(response.body);
                setLocalSettings(response.body);
                loadBackground(response.body);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        }
    };

    if (!backgroundSrc) {
        return null;
    }

    const [blur, brightness, saturate, opacity] = settings.customBackgroundFilter;

    const imgStyle: React.CSSProperties = {
        position: "absolute",
        objectFit: settings.customBackgroundSize === "max" ? "none" : settings.customBackgroundSize as "cover" | "contain",
        filter: `blur(${blur}rem) brightness(${brightness}) saturate(${saturate})`,
        opacity: imageLoaded ? opacity : 0,
        width: blur > 0 ? `calc(100% + ${blur * 4}rem)` : "100%",
        height: blur > 0 ? `calc(100% + ${blur * 4}rem)` : "100%",
        left: blur > 0 ? `-${blur * 2}rem` : "0",
        top: blur > 0 ? `-${blur * 2}rem` : "0",
        transition: "opacity 0.3s ease",
    };

    return (
        <div
            className="custom-background"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: -1,
                overflow: "hidden",
                backgroundColor: "var(--bg-primary)",
            }}
        >
            <img
                src={backgroundSrc}
                alt=""
                style={imgStyle}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
            />
        </div>
    );
}
