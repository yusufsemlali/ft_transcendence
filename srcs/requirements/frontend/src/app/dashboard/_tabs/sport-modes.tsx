"use client";

import { useState, useEffect } from "react";
import type { Sport } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  esports:  { icon: "sports_esports", color: "var(--primary)" },
  physical: { icon: "sports_soccer",  color: "var(--accent-success, #22c55e)" },
  tabletop: { icon: "casino",         color: "var(--accent-warning, #f59e0b)" },
};

const MODE_LABELS: Record<string, string> = {
  "1v1": "1 vs 1",
  team: "Team",
  ffa: "Free for All",
};

const SCORING_LABELS: Record<string, string> = {
  points_high: "Points (High)",
  time_low: "Time (Low)",
  sets: "Sets",
  binary: "Binary",
  stocks: "Stocks",
};

export function SportModesTab() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.sports.getSports();
        if (res.status === 200) setSports(res.body);
      } catch { }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = sports.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Sport Modes</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{sports.length} sport{sports.length !== 1 ? "s" : ""} available</p>
        </div>
        <div style={{ position: "relative" }}>
          <span className="material-symbols-outlined" style={{
            position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
            fontSize: "16px", color: "var(--text-muted)", pointerEvents: "none",
          }}>search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sports..."
            className="dashboard-input"
            style={{ paddingLeft: "32px", width: "200px", fontSize: "12px" }}
          />
        </div>
      </div>

      {/* Sports grid */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", opacity: 0.3 }}>sports</span>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "12px" }}>
            {search ? `No sports matching "${search}"` : "No sports have been configured yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: "12px" }}>
          {filtered.map(sport => {
            const cat = CATEGORY_META[sport.category] || CATEGORY_META.esports;
            return (
              <div key={sport.id} className="glass-card" style={{ padding: "20px", transition: "transform 0.15s, box-shadow 0.15s" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: `color-mix(in srgb, ${cat.color} 12%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: cat.color }}>{cat.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{sport.name}</div>
                    <div style={{
                      fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px",
                      color: cat.color, marginTop: "2px",
                    }}>{sport.category}</div>
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <DetailChip label="Mode" value={MODE_LABELS[sport.mode] || sport.mode} />
                  <DetailChip label="Scoring" value={SCORING_LABELS[sport.scoringType] || sport.scoringType} />
                  <DetailChip label="Draws" value={sport.defaultHasDraws ? "Allowed" : "No draws"} />
                  <DetailChip label="Team Size" value={
                    sport.defaultMinTeamSize && sport.defaultMaxTeamSize
                      ? `${sport.defaultMinTeamSize}–${sport.defaultMaxTeamSize}`
                      : sport.mode === "1v1" ? "Solo" : "—"
                  } />
                </div>

                {/* Handle type */}
                {sport.requiredHandleType && (
                  <div style={{
                    marginTop: "10px", padding: "6px 10px", borderRadius: "6px",
                    background: "color-mix(in srgb, var(--accent-info, #3b82f6) 8%, transparent)",
                    fontSize: "11px", color: "var(--accent-info, #3b82f6)",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>link</span>
                    Requires: {sport.requiredHandleType.replace(/_/g, " ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: "6px 10px", borderRadius: "6px",
      background: "color-mix(in srgb, var(--text-muted) 6%, transparent)",
    }}>
      <div style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "500" }}>{value}</div>
    </div>
  );
}
