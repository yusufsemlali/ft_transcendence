"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import api from "@/lib/api/api";
import { Sport } from "@ft-transcendence/contracts";
import { toast } from "@/components/ui/sonner";

const MODES = ["1v1", "team", "ffa"] as const;
const CATEGORIES = ["esports", "physical", "tabletop"] as const;
const SCORING_TYPES = ["points_high", "time_low", "sets", "binary", "stocks"] as const;

const CATEGORY_ICONS: Record<string, string> = {
  esports: "sports_esports",
  physical: "fitness_center",
  tabletop: "casino",
};

const MODE_COLORS: Record<string, string> = {
  "1v1": "var(--accent-info, #60a5fa)",
  team: "var(--accent-success, #4ade80)",
  ffa: "var(--accent-warning, #fbbf24)",
};

export default function SportsAdminPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "esports" as string,
    scoringType: "points_high" as string,
    mode: "1v1" as string,
    requiredHandleType: "",
    defaultMinTeamSize: 1,
    defaultMaxTeamSize: 1,
    defaultHasDraws: false,
    tournamentConfigSchema: "{}",
    matchConfigSchema: "{}",
  });

  useEffect(() => { loadSports(); }, []);

  const loadSports = async () => {
    setLoading(true);
    try {
      const res = await api.sports.getSports({});
      if (res.status === 200) setSports(res.body);
    } catch { toast.error("Failed to load sports"); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingSport(null);
    setForm({ name: "", category: "esports", scoringType: "points_high", mode: "1v1", requiredHandleType: "", defaultMinTeamSize: 1, defaultMaxTeamSize: 1, defaultHasDraws: false, tournamentConfigSchema: "{}", matchConfigSchema: "{}" });
    setShowModal(true);
  };

  const openEdit = (sport: Sport) => {
    setEditingSport(sport);
    setForm({
      name: sport.name, category: sport.category, scoringType: sport.scoringType, mode: sport.mode,
      requiredHandleType: sport.requiredHandleType || "", defaultMinTeamSize: sport.defaultMinTeamSize || 1,
      defaultMaxTeamSize: sport.defaultMaxTeamSize || 1, defaultHasDraws: sport.defaultHasDraws,
      tournamentConfigSchema: JSON.stringify(sport.tournamentConfigSchema, null, 2),
      matchConfigSchema: JSON.stringify(sport.matchConfigSchema, null, 2),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let tcs = {}, mcs = {};
      try { tcs = JSON.parse(form.tournamentConfigSchema); } catch { toast.error("Invalid tournament config JSON"); setSubmitting(false); return; }
      try { mcs = JSON.parse(form.matchConfigSchema); } catch { toast.error("Invalid match config JSON"); setSubmitting(false); return; }
      const body: any = { ...form, requiredHandleType: form.requiredHandleType || null, tournamentConfigSchema: tcs, matchConfigSchema: mcs };
      if (editingSport) {
        const res = await api.sports.update({ params: { id: editingSport.id }, body });
        if (res.status === 200) { toast.success("Sport updated"); setShowModal(false); loadSports(); }
        else toast.error((res.body as any).message || "Update failed");
      } else {
        const res = await api.sports.create({ body });
        if (res.status === 201) { toast.success("Sport created"); setShowModal(false); loadSports(); }
        else toast.error((res.body as any).message || "Create failed");
      }
    } catch { toast.error("Operation failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (sport: Sport) => {
    if (!confirm(`Delete "${sport.name}"? This cannot be undone.`)) return;
    try {
      const res = await api.sports.delete({ params: { id: sport.id } });
      if (res.status === 204) { toast.success("Sport deleted"); loadSports(); }
      else toast.error((res.body as any)?.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
  };

  const inputCls = "w-full h-10 px-3 rounded-md bg-[var(--bg-secondary,rgba(255,255,255,0.03))] border border-[var(--border-color,rgba(255,255,255,0.08))] text-sm font-[var(--font-mono,monospace)] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary,#60a5fa)]/30";
  const labelCls = "block mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]";

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Hero Header */}
        <div className="glass-card" style={{ padding: "48px", marginBottom: "32px", position: "relative", overflow: "hidden", border: "1px solid var(--border-color)" }}>
          <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, color-mix(in srgb, var(--accent-primary, #60a5fa), transparent 92%) 0%, transparent 70%)", zIndex: 0 }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "var(--accent-primary, #60a5fa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "white" }}>sports_esports</span>
              </div>
              <div>
                <h1 style={{ fontSize: "32px", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>Sports Catalog</h1>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Manage game definitions, scoring rules, and tournament blueprints</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "32px", marginTop: "24px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", fontWeight: 700 }}>TOTAL SPORTS</div>
                <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{loading ? "..." : sports.length}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", fontWeight: 700 }}>CATEGORIES</div>
                <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{loading ? "..." : new Set(sports.map(s => s.category)).size}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", fontWeight: 700 }}>ESPORTS</div>
                <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-info, #60a5fa)" }}>{loading ? "..." : sports.filter(s => s.category === "esports").length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "1px", fontWeight: 700, textTransform: "uppercase" }}>
            All Sports ({sports.length})
          </div>
          <button onClick={openCreate} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: "var(--primary)", color: "white" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            New Sport
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: "24px", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
                <div style={{ height: "20px", width: "60%", background: "var(--border-color)", borderRadius: "4px", marginBottom: "12px" }} />
                <div style={{ height: "14px", width: "40%", background: "var(--border-color)", borderRadius: "4px", marginBottom: "16px" }} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ height: "24px", width: "50px", background: "var(--border-color)", borderRadius: "12px" }} />
                  <div style={{ height: "24px", width: "70px", background: "var(--border-color)", borderRadius: "12px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : sports.length === 0 ? (
          <div className="glass-card" style={{ padding: "80px 40px", textAlign: "center", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "var(--text-muted)", opacity: 0.15 }}>sports_esports</span>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "16px", fontFamily: "var(--font-mono)", letterSpacing: "2px", textTransform: "uppercase" }}>No sports configured yet</p>
            <button onClick={openCreate} style={{ marginTop: "20px", padding: "10px 24px", borderRadius: "8px", background: "var(--primary)", color: "white", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Create your first sport
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            {sports.map((sport) => (
              <div key={sport.id} className="glass-card" style={{ padding: "0", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s, transform 0.2s", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {/* Color strip */}
                <div style={{ height: "3px", background: MODE_COLORS[sport.mode] || "var(--primary)" }} />

                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--bg-secondary, rgba(255,255,255,0.03))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--text-muted)" }}>{CATEGORY_ICONS[sport.category] || "sports"}</span>
                      </div>
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{sport.name}</h3>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{sport.category}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => openEdit(sport)} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                      </button>
                      <button onClick={() => handleDelete(sport)} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "14px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, fontFamily: "var(--font-mono)", background: `color-mix(in srgb, ${MODE_COLORS[sport.mode] || "var(--primary)"}, transparent 88%)`, color: MODE_COLORS[sport.mode] || "var(--primary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{sport.mode}</span>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, fontFamily: "var(--font-mono)", background: "var(--bg-secondary, rgba(255,255,255,0.03))", color: "var(--text-muted)", border: "1px solid var(--border-color)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{sport.scoringType.replace(/_/g, " ")}</span>
                    {sport.defaultHasDraws && (
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, fontFamily: "var(--font-mono)", background: "var(--bg-secondary, rgba(255,255,255,0.03))", color: "var(--text-muted)", border: "1px solid var(--border-color)", letterSpacing: "0.5px", textTransform: "uppercase" }}>draws</span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div style={{ display: "flex", gap: "20px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>group</span>
                      {sport.defaultMinTeamSize || 1}v{sport.defaultMaxTeamSize || 1}
                    </span>
                    {sport.requiredHandleType && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>link</span>
                        {sport.requiredHandleType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowModal(false)}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }} onClick={(e: any) => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>{editingSport ? "Edit Sport" : "New Sport"}</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{editingSport ? "Update sport configuration" : "Define a new game blueprint"}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>

            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ ...{} }} className={labelCls}>Sport Name</label>
                  <input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. League of Legends" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className={labelCls}>Category</label>
                    <select value={form.category} onChange={(e: any) => setForm({ ...form, category: e.target.value })} className={inputCls} style={{ cursor: "pointer" }}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Mode</label>
                    <select value={form.mode} onChange={(e: any) => setForm({ ...form, mode: e.target.value })} className={inputCls} style={{ cursor: "pointer" }}>
                      {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Scoring</label>
                    <select value={form.scoringType} onChange={(e: any) => setForm({ ...form, scoringType: e.target.value })} className={inputCls} style={{ cursor: "pointer" }}>
                      {SCORING_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className={labelCls}>Min Team Size</label>
                    <input type="number" min={1} value={form.defaultMinTeamSize} onChange={(e: any) => setForm({ ...form, defaultMinTeamSize: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Max Team Size</label>
                    <input type="number" min={1} value={form.defaultMaxTeamSize} onChange={(e: any) => setForm({ ...form, defaultMaxTeamSize: Number(e.target.value) })} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Required Handle Type</label>
                  <input value={form.requiredHandleType} onChange={(e: any) => setForm({ ...form, requiredHandleType: e.target.value })} className={inputCls} placeholder="e.g. riot_id (optional)" />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 0" }}>
                  <input type="checkbox" checked={form.defaultHasDraws} onChange={(e: any) => setForm({ ...form, defaultHasDraws: e.target.checked })} style={{ width: "16px", height: "16px", borderRadius: "4px", accentColor: "var(--primary)" }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Allow Draws</span>
                </label>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid var(--border-color)" }}>
                  <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={submitting || !form.name} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: submitting || !form.name ? 0.5 : 1 }}>
                    {submitting ? "Saving..." : editingSport ? "Save Changes" : "Create Sport"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
