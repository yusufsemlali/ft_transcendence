export function EmptyPanel({ icon, title, subtitle, actionLabel, onAction }: {
  icon: string; title: string; subtitle: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="glass-card dashboard-empty-panel">
      <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", opacity: 0.3 }}>{icon}</span>
      <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "16px 0 8px" }}>{title}</h3>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "320px", lineHeight: "1.5" }}>{subtitle}</p>
      {actionLabel && (
        <button className="btn btn-primary" style={{ marginTop: "20px", fontSize: "11px", padding: "8px 20px" }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
