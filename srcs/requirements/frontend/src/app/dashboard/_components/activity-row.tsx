export function ActivityRow({ icon, text, time, accent }: {
  icon: string; text: string; time: string; accent?: string;
}) {
  return (
    <div className="dashboard-activity-row">
      <div className="dashboard-activity-dot" style={{ background: accent || "var(--primary)" }} />
      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: accent || "var(--text-muted)" }}>{icon}</span>
      <span style={{ flex: 1, fontSize: "13px", color: "var(--text-secondary)" }}>{text}</span>
      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{time}</span>
    </div>
  );
}
