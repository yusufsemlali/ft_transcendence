"use client";

/* ── Integrations Tab ── */
/* Visual-only integration cards. No backend integration API exists yet. */

const INTEGRATIONS: {
  id: string; name: string; description: string; icon: string;
  color: string; status: "coming_soon" | "available";
}[] = [
  {
    id: "discord",
    name: "Discord",
    description: "Send tournament updates, match results, and announcements to your Discord server via webhooks.",
    icon: "forum",
    color: "#5865F2",
    status: "coming_soon",
  },
  {
    id: "twitch",
    name: "Twitch",
    description: "Embed live streams in tournament pages and auto-detect when matches are being streamed.",
    icon: "live_tv",
    color: "#9146FF",
    status: "coming_soon",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Send real-time HTTP callbacks to your own services when events occur in your organization.",
    icon: "webhook",
    color: "var(--accent-warning, #f59e0b)",
    status: "coming_soon",
  },
  {
    id: "email",
    name: "Email Notifications",
    description: "Send email notifications to members for tournament invites, match reminders, and results.",
    icon: "mail",
    color: "var(--accent-info, #3b82f6)",
    status: "coming_soon",
  },
  {
    id: "challonge",
    name: "Challonge Import",
    description: "Import existing brackets and tournaments from Challonge to manage them here.",
    icon: "download",
    color: "var(--accent-success, #22c55e)",
    status: "coming_soon",
  },
  {
    id: "api",
    name: "Public API",
    description: "Enable public read-only API access for your organization's tournaments and standings.",
    icon: "api",
    color: "var(--primary)",
    status: "coming_soon",
  },
];

export function IntegrationsTab() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Integrations</h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Connect external services to enhance your organization.</p>
      </div>

      {/* Integration cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: "12px" }}>
        {INTEGRATIONS.map(integration => (
          <div key={integration.id} className="glass-card" style={{
            padding: "24px",
            opacity: integration.status === "coming_soon" ? 0.6 : 1,
            transition: "transform 0.15s, box-shadow 0.15s",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: `color-mix(in srgb, ${integration.color} 12%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: integration.color }}>{integration.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{integration.name}</span>
                  {integration.status === "coming_soon" && (
                    <span style={{
                      fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px",
                      padding: "2px 6px", borderRadius: "4px",
                      background: "color-mix(in srgb, var(--accent-warning, #f59e0b) 12%, transparent)",
                      color: "var(--accent-warning, #f59e0b)",
                    }}>Coming Soon</span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", lineHeight: "1.5" }}>
                  {integration.description}
                </p>
              </div>
            </div>

            {/* Action */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {integration.status === "available" ? (
                <button
                  className="btn btn-secondary"
                  style={{
                    fontSize: "11px", padding: "6px 16px",
                    color: integration.color,
                    borderColor: `color-mix(in srgb, ${integration.color} 30%, transparent)`,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
                  Configure
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  disabled
                  style={{ fontSize: "11px", padding: "6px 16px", opacity: 0.4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>hourglass_empty</span>
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "20px", textAlign: "center", opacity: 0.5 }}>
        Integration configuration will be available in a future update.
      </p>
    </div>
  );
}
