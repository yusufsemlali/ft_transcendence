"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api/api";
import type { Organization } from "@ft-transcendence/contracts";

/* ── Create Org Form Fields ── */
function OrgFormFields({ 
  onCreated, 
  onCancel 
}: {
  onCreated: (org: Organization) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    visibility: "public" as "public" | "private",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);

  const toSlug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: autoSlug ? toSlug(name) : prev.slug,
    }));
  };

  const handleSlugChange = (slug: string) => {
    setAutoSlug(false);
    setForm(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug) {
      setError("Name and slug are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.organizations.createOrganization({
        body: {
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          visibility: form.visibility,
        },
      });
      if (res.status === 201) {
        onCreated(res.body.data);
      } else {
        setError((res.body as any)?.message || "Failed to create organization");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: "300", color: "var(--text-primary)", marginBottom: "8px" }}>
          Create Your Organization
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
          Set up a professional environment for your tournaments.
        </p>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "6px", background: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)", fontSize: "12px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" }}>
        <label className="dashboard-field">
          <span className="dashboard-field-label">Organization Name *</span>
          <input
            type="text"
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g. Competitive Gaming League"
            className="dashboard-input"
            autoFocus
          />
        </label>

        <label className="dashboard-field">
          <span className="dashboard-field-label">Slug *</span>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "var(--text-muted)" }}>/</span>
            <input
              type="text"
              value={form.slug}
              onChange={e => handleSlugChange(e.target.value)}
              placeholder="competitive-gaming-league"
              className="dashboard-input"
              style={{ paddingLeft: "24px" }}
            />
          </div>
        </label>

        <label className="dashboard-field">
          <span className="dashboard-field-label">Description</span>
          <textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What is this organization about?"
            className="dashboard-input"
            rows={2}
          />
        </label>

        <label className="dashboard-field">
          <span className="dashboard-field-label">Visibility</span>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["public", "private"] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, visibility: v }))}
                className={`dashboard-visibility-btn ${form.visibility === v ? "active" : ""}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {v === "public" ? "public" : "lock"}
                </span>
                <span style={{ textTransform: "capitalize" }}>{v}</span>
              </button>
            ))}
          </div>
        </label>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding: "14px 32px", fontSize: "12px", fontWeight: "700" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{submitting ? "progress_activity" : "add_business"}</span>
          {submitting ? "CREATING..." : "CREATE ORGANIZATION"}
        </button>
        <button className="btn btn-secondary" onClick={onCancel} style={{ padding: "14px 32px", fontSize: "12px" }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

/* ── Hero Content (Static Hero) ── */
function OnboardingHero({ onStartCreate, onBack }: { onStartCreate: () => void; onBack: () => void }) {
  return (
    <div className="animate-fade-in">
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
        <button className="btn btn-primary" onClick={onStartCreate} style={{ padding: "14px 32px", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_business</span>
          CREATE ORGANIZATION
        </button>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: "14px 32px", fontSize: "12px" }}>
          Go Back
        </button>
      </div>
    </div>
  );
}

/* ── Main Org Picker Gateway ── */
export function OrgPicker({ orgs, loading, onSelect, onOrgCreated }: {
  orgs: Organization[];
  loading: boolean;
  onSelect: (org: Organization) => void;
  onOrgCreated: (org: Organization) => void;
}) {
  const { user } = useAuth();
  const [showFlow, setShowFlow] = useState(false); // Controls the hero
  const [showForm, setShowForm] = useState(false); // Controls the swap inside hero

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

  const hasOrgs = orgs.length > 0;
  
  // Decide whether to show the "Hero Journey"
  const inFlow = showFlow || !hasOrgs;

  const handleCancel = () => {
    if (showForm) {
      setShowForm(false); // Back to hero within flow
    } else {
      setShowFlow(false); // Back to grid
    }
  };

  const handleBackToStart = () => {
    // If we have orgs, "Go Back" returns to the grid. 
    // If we have NO orgs, we can't go "back" to a grid, so maybe just reset (or in real app, go back to previous route)
    if (hasOrgs) {
      setShowFlow(false);
    } else {
      // Potentially history.back() or nothing
      window.history.back();
    }
  };

  return (
    <div className="page" style={{ minHeight: "100vh", color: "var(--text-primary)" }}>
      {/* Header (Only shown in grid mode) */}
      {!inFlow && (
        <div style={{ marginBottom: "clamp(40px, 6vw, 64px)", paddingTop: "clamp(20px, 4vw, 40px)" }} className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span className="badge" style={{ backgroundColor: "var(--accent-secondary)", color: "white" }}>COMMAND CENTER</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: "300", marginBottom: "8px" }}>
            Select an Organization
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "500px" }}>
            Choose an organization to access its dashboard, tournaments, and management tools.
          </p>
        </div>
      )}

      {/* Hero / Create Container */}
      {inFlow ? (
        <div className="glass-card dashboard-onboarding animate-fade-in" style={{ marginTop: hasOrgs ? "0" : "clamp(40px, 10vh, 100px)" }}>
          <div className="dashboard-onboarding-content">
            {showForm ? (
              <OrgFormFields onCreated={onOrgCreated} onCancel={handleCancel} />
            ) : (
              <OnboardingHero onStartCreate={() => setShowForm(true)} onBack={handleBackToStart} />
            )}
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
      ) : (
        /* Grid Layout */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
          gap: "20px",
          marginBottom: "40px"
        }} className="animate-fade-in">
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
          <button className="glass-card dashboard-org-card dashboard-org-card-create" onClick={() => setShowFlow(true)}>
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
      )}
    </div>
  );
}
