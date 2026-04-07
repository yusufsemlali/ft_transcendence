"use client";

import { useState, useEffect } from "react";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import type { Sport } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { EmptyPanel } from "../_components/empty-panel";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/* ── Status badge colors ── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:        { label: "Draft",        color: "var(--text-muted)" },
  registration: { label: "Registration", color: "var(--accent-info)" },
  upcoming:     { label: "Upcoming",     color: "var(--accent-secondary)" },
  ongoing:      { label: "Live",         color: "var(--accent-success)" },
  completed:    { label: "Completed",    color: "var(--text-muted)" },
  cancelled:    { label: "Cancelled",    color: "var(--destructive)" },
};

const BRACKET_LABELS: Record<string, string> = {
  single_elimination: "Single Elim",
  double_elimination: "Double Elim",
  round_robin:        "Round Robin",
  swiss:              "Swiss",
  free_for_all:       "FFA",
};

/* ── Tournament Row ── */
function TournamentRow({ t, onSelect }: { t: Tournament; onSelect: () => void }) {
  const status = STATUS_MAP[t.status] || STATUS_MAP.draft;
  return (
    <button className="dashboard-tournament-row" onClick={onSelect} style={{ position: "relative", overflow: "hidden" }}>
      {/* Banner — faded behind the row */}
      {t.bannerUrl && (
        <div className="tournament-row-banner" style={{ backgroundImage: `url(${t.bannerUrl})` }} />
      )}

      {/* Content — always on top */}
      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{t.name}</span>
          <span className="dashboard-status-badge" style={{ background: `color-mix(in srgb, ${status.color} 15%, transparent)`, color: status.color }}>
            {status.label}
          </span>
          {t.isPrivate && (
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--text-muted)", opacity: 0.6 }}>lock</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "var(--text-muted)" }}>
          <span>{BRACKET_LABELS[t.bracketType] || t.bracketType}</span>
          <span className="tournament-row-sep">·</span>
          <span>{t.mode}</span>
          <span className="tournament-row-sep">·</span>
          <span>{t.minParticipants}–{t.maxParticipants} players</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
        {t.prizePool && (
          <span style={{ fontSize: "12px", color: "var(--accent-warning)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{t.prizePool}</span>
        )}
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {new Date(t.createdAt).toLocaleDateString()}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>chevron_right</span>
      </div>
    </button>
  );
}

/* ── Create Tournament Modal ── */
function CreateForm({ org, sports, onCreated, onCancel }: {
  org: Organization; sports: Sport[]; onCreated: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    sportId: "",
    name: "",
    description: "",
    bracketType: "single_elimination" as const,
    mode: "1v1" as "1v1" | "team" | "ffa",
    minTeamSize: 1,
    maxTeamSize: 1,
    allowDraws: false,
    requiredHandleType: null as string | null,
    minParticipants: 2,
    maxParticipants: 16,
    isPrivate: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When sport is selected, pre-fill defaults from the sport blueprint
  const handleSportChange = (sportId: string) => {
    const sport = sports.find(s => s.id === sportId);
    setForm(prev => ({
      ...prev,
      sportId,
      mode: sport?.mode || prev.mode,
      allowDraws: sport?.defaultHasDraws ?? prev.allowDraws,
      minTeamSize: sport?.defaultMinTeamSize ?? prev.minTeamSize,
      maxTeamSize: sport?.defaultMaxTeamSize ?? prev.maxTeamSize,
      requiredHandleType: sport?.requiredHandleType ?? null,
    }));
  };

  const handleSubmit = async () => {
    if (!form.sportId || !form.name) {
      setError("Sport and name are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.tournaments.createTournament({
        params: { organizationId: org.id },
        body: {
          ...form,
          customSettings: {},
        },
      });
      if (res.status === 201) {
        onCreated();
      } else {
        setError((res.body as any)?.message || "Failed to create tournament");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>Create Tournament</h3>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "6px", background: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)", fontSize: "12px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "16px" }}>
        {/* Sport */}
        <label className="dashboard-field">
          <span className="dashboard-field-label">Sport *</span>
          <Select value={form.sportId} onValueChange={handleSportChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a sport..." />
            </SelectTrigger>
            <SelectContent>
              {sports.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.category})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {/* Name */}
        <label className="dashboard-field">
          <span className="dashboard-field-label">Tournament Name *</span>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Spring Championship 2025"
            className="dashboard-input"
          />
        </label>

        {/* Bracket Type */}
        <label className="dashboard-field">
          <span className="dashboard-field-label">Bracket Type</span>
          <Select value={form.bracketType} onValueChange={val => setForm(prev => ({ ...prev, bracketType: val as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single_elimination">Single Elimination</SelectItem>
              <SelectItem value="double_elimination">Double Elimination</SelectItem>
              <SelectItem value="round_robin">Round Robin</SelectItem>
              <SelectItem value="swiss">Swiss</SelectItem>
              <SelectItem value="free_for_all">Free for All</SelectItem>
            </SelectContent>
          </Select>
        </label>

        {/* Mode */}
        <label className="dashboard-field">
          <span className="dashboard-field-label">Mode</span>
          <Select value={form.mode} onValueChange={val => setForm(prev => ({ ...prev, mode: val as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1v1">1v1</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="ffa">Free for All</SelectItem>
            </SelectContent>
          </Select>
        </label>

        {/* Participants */}
        <label className="dashboard-field">
          <span className="dashboard-field-label">Min Participants</span>
          <input type="number" min={2} value={form.minParticipants} onChange={e => setForm(prev => ({ ...prev, minParticipants: +e.target.value }))} className="dashboard-input" />
        </label>
        <label className="dashboard-field">
          <span className="dashboard-field-label">Max Participants</span>
          <input type="number" min={2} value={form.maxParticipants} onChange={e => setForm(prev => ({ ...prev, maxParticipants: +e.target.value }))} className="dashboard-input" />
        </label>

        {/* Team Size (visible when team mode) */}
        {form.mode === "team" && (
          <>
            <label className="dashboard-field">
              <span className="dashboard-field-label">Min Team Size</span>
              <input type="number" min={1} value={form.minTeamSize} onChange={e => setForm(prev => ({ ...prev, minTeamSize: +e.target.value }))} className="dashboard-input" />
            </label>
            <label className="dashboard-field">
              <span className="dashboard-field-label">Max Team Size</span>
              <input type="number" min={1} value={form.maxTeamSize} onChange={e => setForm(prev => ({ ...prev, maxTeamSize: +e.target.value }))} className="dashboard-input" />
            </label>
          </>
        )}

        {/* Description — full width */}
        <label className="dashboard-field" style={{ gridColumn: "1 / -1" }}>
          <span className="dashboard-field-label">Description</span>
          <textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional tournament description..."
            className="dashboard-input"
            rows={3}
            style={{ resize: "vertical" }}
          />
        </label>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
        <button className="btn btn-secondary" onClick={onCancel} style={{ fontSize: "12px", padding: "8px 20px" }}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ fontSize: "12px", padding: "8px 20px" }}>
          {submitting ? "Creating..." : "Create Tournament"}
        </button>
      </div>
    </div>
  );
}

/* ── Main Tab ── */
export function TournamentsTab({ org, initialCreate, onSelectTournament }: {
  org: Organization;
  initialCreate?: boolean;
  onSelectTournament?: (t: Tournament) => void;
}) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(initialCreate ?? false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        api.tournaments.listOrgTournaments({ params: { organizationId: org.id } }),
        api.sports.getSports(),
      ]);
      if (tRes.status === 200) setTournaments(tRes.body);
      if (sRes.status === 200) setSports(sRes.body);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [org.id]);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Tournaments</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}</p>
        </div>
        {!showCreate && (
          <button className="btn btn-primary" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => setShowCreate(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
            New Tournament
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ marginBottom: "20px" }}>
          <CreateForm
            org={org}
            sports={sports}
            onCreated={() => { setShowCreate(false); fetchData(); }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Tournament list */}
      {tournaments.length === 0 && !showCreate ? (
        <EmptyPanel
          icon="emoji_events"
          title="No Tournaments Yet"
          subtitle="Create your first tournament to start managing brackets, matches, and standings."
          actionLabel="+ Create Tournament"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          {tournaments.map((t) => (
            <TournamentRow key={t.id} t={t} onSelect={() => onSelectTournament?.(t)} />
          ))}
        </div>
      )}
    </div>
  );
}
