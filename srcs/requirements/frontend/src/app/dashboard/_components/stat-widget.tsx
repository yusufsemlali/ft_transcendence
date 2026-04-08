export function StatWidget({ icon, label, value, accent }: {
  icon: string; label: string; value: string; accent?: string;
}) {
  return (
    <div className="glass-card dashboard-stat-widget" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="dashboard-stat-label" style={{ marginBottom: "4px" }}>{label}</div>
          <div className="dashboard-stat-value" style={{ fontSize: "20px", color: accent || "var(--text-primary)" }}>{value}</div>
        </div>
        <div className="dashboard-stat-icon-wrap" style={{ width: "32px", height: "32px", background: accent ? `color-mix(in srgb, ${accent} 15%, transparent)` : undefined }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: accent || "var(--text-muted)" }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
