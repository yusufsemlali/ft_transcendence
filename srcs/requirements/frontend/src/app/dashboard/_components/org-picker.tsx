import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { Organization } from "@ft-transcendence/contracts";

export function OrgPicker({ orgs, loading, onSelect }: {
  orgs: Organization[];
  loading: boolean;
  onSelect: (org: Organization) => void;
}) {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
          <p style={{ color: "var(--text-muted)", marginTop: "16px", fontSize: "13px" }}>Loading your organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ minHeight: "100vh", color: "var(--text-primary)" }}>
      {/* Header */}
      <div style={{ marginBottom: "clamp(40px, 6vw, 64px)", paddingTop: "clamp(20px, 4vw, 40px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <span className="badge" style={{ backgroundColor: "var(--accent-secondary)", color: "white" }}>COMMAND CENTER</span>
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: "300", marginBottom: "8px" }}>
          {orgs.length > 0 ? "Select an Organization" : `Welcome, ${user?.displayName || user?.username || "Commander"}`}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "500px" }}>
          {orgs.length > 0
            ? "Choose an organization to access its dashboard, tournaments, and management tools."
            : "Create your first organization to start managing tournaments, members, and competitions."
          }
        </p>
      </div>

      {orgs.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
          gap: "20px",
          marginBottom: "40px"
        }}>
          {orgs.map(org => (
            <button key={org.id} className="glass-card dashboard-org-card" onClick={() => onSelect(org)}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div className="dashboard-org-card-avatar">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "var(--primary)" }}>workspaces</span>
                  )}
                </div>
                <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {org.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>/{org.slug}</div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--text-muted)" }}>chevron_right</span>
              </div>

              {org.description && (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", textAlign: "left", marginBottom: "16px" }}>
                  {org.description}
                </p>
              )}

              <div style={{ display: "flex", gap: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "1px", fontWeight: "700" }}>VISIBILITY</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "capitalize" }}>{org.visibility}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "1px", fontWeight: "700" }}>CREATED</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{new Date(org.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </button>
          ))}

          {/* Create new org card */}
          <button className="glass-card dashboard-org-card dashboard-org-card-create" onClick={() => {}}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "20px 0" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                border: "2px dashed var(--border-color)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "var(--text-muted)" }}>add</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>Create Organization</span>
            </div>
          </button>
        </div>
      ) : (
        /* No orgs — onboarding CTA */
        <div className="glass-card dashboard-onboarding" style={{ marginTop: "20px" }}>
          <div className="dashboard-onboarding-content">
            <span className="material-symbols-outlined" style={{ fontSize: "56px", color: "var(--primary)", opacity: 0.6, marginBottom: "24px" }}>add_business</span>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: "300", color: "var(--text-primary)", marginBottom: "12px" }}>
              Initialize Your First Organization
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "500px", lineHeight: "1.6", marginBottom: "32px" }}>
              Organizations are the foundation of your tournament infrastructure.
              Create one to start managing brackets, members, and competitions at scale.
            </p>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "40px" }}>
              {[
                { icon: "account_tree", label: "Configure Brackets", desc: "Single & double elimination" },
                { icon: "group", label: "Manage Members", desc: "Roles, invites, & permissions" },
                { icon: "scoreboard", label: "Track Matches", desc: "Live scoring & standings" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)", marginTop: "2px" }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{f.label}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_business</span>
                CREATE ORGANIZATION
              </button>
              <Link href="/about" className="btn btn-secondary" style={{ padding: "14px 32px", fontSize: "12px" }}>
                Learn More
              </Link>
            </div>
          </div>

          <div className="dashboard-onboarding-visual hide-mobile">
            <div className="dashboard-onboarding-card-mock">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-info)" }} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: "16px", height: "3px", borderRadius: "2px", background: "var(--border-color)" }} />
                  <div style={{ width: "32px", height: "3px", borderRadius: "2px", background: "var(--border-color)" }} />
                </div>
              </div>
              <div style={{ width: "60%", height: "6px", borderRadius: "3px", background: "var(--primary)", marginBottom: "16px", opacity: 0.6 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ height: "48px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }} />
                <div style={{ height: "48px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }} />
              </div>
              <div style={{ width: "100%", height: "64px", borderRadius: "6px", background: "var(--gradient-prism)", opacity: 0.06, marginTop: "8px" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
