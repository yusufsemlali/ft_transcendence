"use client";

import { useState } from "react";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

export function TournamentSettingsTab({ tournament, org, onUpdate }: {
  tournament: Tournament;
  org: Organization;
  onUpdate: (t: Tournament) => void;
}) {
  const [form, setForm] = useState({
    name: tournament.name,
    description: tournament.description || "",
    bracketType: tournament.bracketType,
    isPrivate: tournament.isPrivate,
    mode: tournament.mode,
    minTeamSize: tournament.minTeamSize,
    maxTeamSize: tournament.maxTeamSize,
    allowDraws: tournament.allowDraws,
    requiredHandleType: tournament.requiredHandleType || "",
    minParticipants: tournament.minParticipants,
    maxParticipants: tournament.maxParticipants,
    prizePool: tournament.prizePool || "",
    entryFee: tournament.entryFee || 0,
    bannerUrl: tournament.bannerUrl || "",
    status: tournament.status,
    customSettings: JSON.stringify(tournament.customSettings, null, 2),
    matchConfigSchema: JSON.stringify(tournament.matchConfigSchema, null, 2),
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      let customSettings = {};
      let matchConfigSchema = {};
      try {
          customSettings = JSON.parse(form.customSettings);
          matchConfigSchema = JSON.parse(form.matchConfigSchema);
      } catch {
          toast.error("Invalid JSON in Custom Settings or Match Config");
          setSubmitting(false);
          return;
      }

      const res = await api.tournaments.updateTournament({
        params: { organizationId: org.id, id: tournament.id },
        body: {
          ...form,
          customSettings,
          matchConfigSchema,
          requiredHandleType: form.requiredHandleType || null,
          description: form.description || null,
          prizePool: form.prizePool || null,
          bannerUrl: form.bannerUrl || null,
        },
      });

      if (res.status === 200) {
        toast.success("Changes saved successfully");
        onUpdate(res.body.data);
      } else {
        toast.error((res.body as any)?.message || "Failed to update tournament");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: "100%" }}>
      <div className="glass-card" style={{ padding: "32px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>General Settings</h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px" }}>Manage your tournament profile, rules, and visibility.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Tournament Name */}
          <label className="dashboard-field" style={{ gridColumn: "1 / -1" }}>
            <span className="dashboard-field-label">Tournament Name</span>
            <input 
              className="dashboard-input" 
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </label>

          {/* Description */}
          <label className="dashboard-field" style={{ gridColumn: "1 / -1" }}>
            <span className="dashboard-field-label">Description</span>
            <textarea 
              className="dashboard-input" 
              rows={3} 
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </label>

          {/* Status */}
          <label className="dashboard-field">
            <span className="dashboard-field-label">Tournament Status</span>
            <Select value={form.status} onValueChange={(val: any) => setForm(f => ({ ...f, status: val }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["draft", "registration", "upcoming", "ongoing", "completed", "cancelled"].map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {/* Bracket Type */}
          <label className="dashboard-field">
            <span className="dashboard-field-label">Bracket Engine</span>
            <Select value={form.bracketType} onValueChange={(val: any) => setForm(f => ({ ...f, bracketType: val }))}>
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

          <div style={{ borderTop: "1px solid var(--border-subtle)", gridColumn: "1 / -1", margin: "12px 0" }} />

          {/* Mode & Privacy */}
          <label className="dashboard-field">
            <span className="dashboard-field-label">Competition Mode</span>
            <Select value={form.mode} onValueChange={(val: any) => setForm(f => ({ ...f, mode: val }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1v1">1v1 Solo</SelectItem>
                <SelectItem value="team">Team / Squad</SelectItem>
                <SelectItem value="ffa">Free for All</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" }}>
            <input 
              type="checkbox" 
              checked={form.isPrivate} 
              onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)" }}>Private Tournament</span>
          </div>

          {/* Team Size */}
          {form.mode === 'team' && (
            <>
              <label className="dashboard-field">
                <span className="dashboard-field-label">Min Team Size</span>
                <input type="number" className="dashboard-input" value={form.minTeamSize} onChange={e => setForm(f => ({ ...f, minTeamSize: +e.target.value }))} />
              </label>
              <label className="dashboard-field">
                <span className="dashboard-field-label">Max Team Size</span>
                <input type="number" className="dashboard-input" value={form.maxTeamSize} onChange={e => setForm(f => ({ ...f, maxTeamSize: +e.target.value }))} />
              </label>
            </>
          )}

          {/* Participants */}
          <label className="dashboard-field">
            <span className="dashboard-field-label">Min Bracket Slots</span>
            <input type="number" className="dashboard-input" value={form.minParticipants} onChange={e => setForm(f => ({ ...f, minParticipants: +e.target.value }))} />
          </label>
          <label className="dashboard-field">
            <span className="dashboard-field-label">Max Capacity</span>
            <input type="number" className="dashboard-input" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: +e.target.value }))} />
          </label>

          <div style={{ borderTop: "1px solid var(--border-subtle)", gridColumn: "1 / -1", margin: "12px 0" }} />

          {/* Economy */}
          <label className="dashboard-field">
            <span className="dashboard-field-label">Prize Pool Description</span>
            <input className="dashboard-input" placeholder="e.g. $500 + T-Shirt" value={form.prizePool} onChange={e => setForm(f => ({ ...f, prizePool: e.target.value }))} />
          </label>
          <label className="dashboard-field">
            <span className="dashboard-field-label">Entry Fee (XP/Points)</span>
            <input type="number" className="dashboard-input" value={form.entryFee} onChange={e => setForm(f => ({ ...f, entryFee: +e.target.value }))} />
          </label>

          {/* Media */}
          <label className="dashboard-field" style={{ gridColumn: "1 / -1" }}>
            <span className="dashboard-field-label">Banner Image URL</span>
            <input className="dashboard-input" placeholder="https://..." value={form.bannerUrl} onChange={e => setForm(f => ({ ...f, bannerUrl: e.target.value }))} />
          </label>

          <div style={{ borderTop: "1px solid var(--border-subtle)", gridColumn: "1 / -1", margin: "12px 0" }} />

          {/* JSON Configs */}
          <label className="dashboard-field" style={{ gridColumn: "1 / -1" }}>
            <span className="dashboard-field-label">Match Engine Configuration (JSON Override)</span>
            <textarea 
              className="dashboard-input" 
              rows={5} 
              style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
              value={form.matchConfigSchema}
              onChange={e => setForm(f => ({ ...f, matchConfigSchema: e.target.value }))}
            />
          </label>
        </div>

        <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit} 
              disabled={submitting}
              style={{ padding: "10px 24px" }}
            >
                {submitting ? "Saving..." : "Save Changes"}
            </button>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: "24px", marginTop: "24px", border: "1px solid rgba(var(--destructive-rgb), 0.2)" }}>
           <h4 style={{ color: "var(--destructive)", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Danger Zone</h4>
           <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>Permanently delete this tournament and all its data. This cannot be undone.</p>
           <button className="btn btn-secondary" style={{ color: "var(--destructive)", borderColor: "rgba(var(--destructive-rgb), 0.2)" }}>
               Delete Tournament
           </button>
      </div>
    </div>
  );
}
