export function StatWidget({ icon, label, value, accent }: {
  icon: string; label: string; value: string; accent?: string;
}) {
  return (
    <div className="glass-card dashboard-stat-widget">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="dashboard-stat-label">{label}</div>
          <div className="dashboard-stat-value" style={{ color: accent || "var(--text-primary)" }}>{value}</div>
        </div>
        <div className="dashboard-stat-icon-wrap" style={{ background: accent ? `color-mix(in srgb, ${accent} 15%, transparent)` : undefined }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: accent || "var(--text-muted)" }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
