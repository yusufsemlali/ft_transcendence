"use client";

import { useState, useEffect } from "react";
import type { Organization } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";

export function OrgSettingsTab({ org }: { org: Organization }) {
  const [form, setForm] = useState({
    name: org.name,
    slug: org.slug,
    description: org.description || "",
    logoUrl: org.logoUrl || "",
    visibility: org.visibility || "public",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState("");

  // Reset form when org changes
  useEffect(() => {
    setForm({
      name: org.name,
      slug: org.slug,
      description: org.description || "",
      logoUrl: org.logoUrl || "",
      visibility: org.visibility || "public",
    });
  }, [org.id]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.organizations.updateOrganization({
        params: { id: org.id },
        body: {
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          logoUrl: form.logoUrl || undefined,
          visibility: form.visibility as "public" | "private",
        },
      });
      if (res.status === 200) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: (res.body as any)?.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteSlug !== org.slug) return;
    try {
      const res = await api.organizations.deleteOrganization({
        params: { id: org.id },
        body: {},
      });
      if (res.status === 200) {
        window.location.href = "/dashboard";
      }
    } catch { }
  };

  const hasChanges = form.name !== org.name || form.slug !== org.slug ||
    (form.description || "") !== (org.description || "") ||
    (form.logoUrl || "") !== (org.logoUrl || "") ||
    form.visibility !== (org.visibility || "public");

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Organization Settings</h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Manage your organization&apos;s profile and configuration.</p>
      </div>

      {/* Status message */}
      {message && (
        <div style={{
          padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
          fontSize: "12px",
          background: message.type === "success"
            ? "color-mix(in srgb, var(--accent-success, #22c55e) 10%, transparent)"
            : "color-mix(in srgb, var(--destructive) 10%, transparent)",
          color: message.type === "success" ? "var(--accent-success, #22c55e)" : "var(--destructive)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{message.type === "success" ? "check_circle" : "error"}</span>
          {message.text}
        </div>
      )}

      {/* General settings */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>info</span>
          <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>GENERAL</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "16px" }}>
          <label className="dashboard-field">
            <span className="dashboard-field-label">Organization Name</span>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="dashboard-input"
              placeholder="My Organization"
            />
          </label>

          <label className="dashboard-field">
            <span className="dashboard-field-label">Slug</span>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
              className="dashboard-input"
              placeholder="my-organization"
            />
            <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>URL-friendly identifier. Lowercase letters, numbers, and hyphens only.</span>
          </label>

          <label className="dashboard-field" style={{ gridColumn: "1 / -1" }}>
            <span className="dashboard-field-label">Description</span>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="dashboard-input"
              rows={3}
              style={{ resize: "vertical" }}
              placeholder="Tell people about your organization..."
            />
          </label>

          <label className="dashboard-field">
            <span className="dashboard-field-label">Logo URL</span>
            <input
              type="url"
              value={form.logoUrl}
              onChange={e => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
              className="dashboard-input"
              placeholder="https://example.com/logo.png"
            />
          </label>

          <label className="dashboard-field">
            <span className="dashboard-field-label">Visibility</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              {(["public", "private"] as const).map(v => (
                <button
                  key={v}
                  className={`btn ${form.visibility === v ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setForm(prev => ({ ...prev, visibility: v }))}
                  style={{ fontSize: "11px", padding: "6px 16px", flex: 1, textTransform: "capitalize" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    {v === "public" ? "public" : "lock"}
                  </span>
                  {v}
                </button>
              ))}
            </div>
          </label>
        </div>

        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{ fontSize: "12px", padding: "8px 24px" }}
          >
            {saving ? (
              <><span className="material-symbols-outlined" style={{ fontSize: "14px", animation: "spin 1s linear infinite" }}>progress_activity</span> Saving...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>save</span> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass-card" style={{
        padding: "24px",
        border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--destructive)" }}>warning</span>
          <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--destructive)" }}>DANGER ZONE</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>Delete this organization</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Once deleted, all tournaments, members, and data will be permanently removed.
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              fontSize: "11px", padding: "6px 16px",
              color: "var(--destructive)",
              borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete_forever</span>
            Delete Organization
          </button>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div style={{
            marginTop: "16px", padding: "16px", borderRadius: "8px",
            background: "color-mix(in srgb, var(--destructive) 5%, transparent)",
            border: "1px solid color-mix(in srgb, var(--destructive) 15%, transparent)",
          }}>
            <p style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: "12px" }}>
              Type <strong style={{ fontFamily: "var(--font-mono)", color: "var(--destructive)" }}>{org.slug}</strong> to confirm deletion:
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={deleteSlug}
                onChange={e => setDeleteSlug(e.target.value)}
                className="dashboard-input"
                placeholder={org.slug}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleDelete}
                disabled={deleteSlug !== org.slug}
                style={{
                  fontSize: "11px", padding: "6px 16px",
                  background: deleteSlug === org.slug ? "var(--destructive)" : undefined,
                  opacity: deleteSlug === org.slug ? 1 : 0.5,
                }}
              >
                Delete Forever
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowDeleteConfirm(false); setDeleteSlug(""); }}
                style={{ fontSize: "11px", padding: "6px 16px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
