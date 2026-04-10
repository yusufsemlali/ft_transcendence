"use client";

import { useState, useEffect, useRef } from "react";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { toastApiError } from "@/lib/api-error";
import {
  TournamentStatusActions,
  TournamentCancelDangerZone,
  TournamentDeleteDangerZone,
} from "../_components/tournament-status-actions";
import { uploadFile } from "@/lib/upload";

export function TournamentSettingsTab({ tournament, org, onUpdate, onDelete }: {
  tournament: Tournament;
  org: Organization;
  onUpdate: (t: Tournament) => void;
  onDelete: () => void;
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
    lobbyCapacity: tournament.lobbyCapacity,
    prizePool: tournament.prizePool || "",
    entryFee: tournament.entryFee || 0,
    bannerUrl: tournament.bannerUrl || "",
    customSettings: JSON.stringify(tournament.customSettings, null, 2),
    matchConfigSchema: JSON.stringify(tournament.matchConfigSchema, null, 2),
  });

  const [submitting, setSubmitting] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
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
      lobbyCapacity: tournament.lobbyCapacity,
      prizePool: tournament.prizePool || "",
      entryFee: tournament.entryFee || 0,
      bannerUrl: tournament.bannerUrl || "",
      customSettings: JSON.stringify(tournament.customSettings, null, 2),
      matchConfigSchema: JSON.stringify(tournament.matchConfigSchema, null, 2),
    });
  }, [tournament.id, tournament.updatedAt]);

  const pickBanner = () => bannerInputRef.current?.click();

  const onBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less.");
      return;
    }
    setBannerUploading(true);
    try {
      const result = await uploadFile(file);
      setForm((f) => ({ ...f, bannerUrl: result.url }));
      toast.success("Banner uploaded — save changes to apply.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBannerUploading(false);
    }
  };

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
          name: form.name,
          description: form.description || null,
          bracketType: form.bracketType,
          isPrivate: form.isPrivate,
          mode: form.mode,
          minTeamSize: form.minTeamSize,
          maxTeamSize: form.maxTeamSize,
          allowDraws: form.allowDraws,
          requiredHandleType: form.requiredHandleType || null,
          minParticipants: form.minParticipants,
          lobbyCapacity: form.lobbyCapacity,
          prizePool: form.prizePool || null,
          entryFee: form.entryFee,
          bannerUrl: form.bannerUrl || null,
          customSettings,
          matchConfigSchema,
        },
      });

      if (res.status === 200) {
        toast.success("Changes saved successfully");
        onUpdate(res.body.data);
      } else {
        toastApiError(res.body, "Failed to update tournament");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: "100%" }}>
      <TournamentStatusActions
        tournament={tournament}
        org={org}
        onUpdate={onUpdate}
        variant="settings"
      />

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
            <span className="dashboard-field-label">Lobby Capacity</span>
            <input type="number" min={2} max={200} className="dashboard-input" value={form.lobbyCapacity} onChange={e => setForm(f => ({ ...f, lobbyCapacity: +e.target.value }))} />
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
          <div className="dashboard-field" style={{ gridColumn: "1 / -1" }}>
            <span className="dashboard-field-label">Tournament banner</span>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap", marginTop: "8px" }}>
              {form.bannerUrl ? (
                <div
                  style={{
                    width: 200,
                    height: 80,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border-subtle)",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={onBannerFile}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={pickBanner}
                  disabled={bannerUploading}
                  style={{ alignSelf: "flex-start" }}
                >
                  {bannerUploading ? "Uploading…" : "Upload banner"}
                </button>
                {form.bannerUrl ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 12, alignSelf: "flex-start" }}
                    onClick={() => setForm((f) => ({ ...f, bannerUrl: "" }))}
                  >
                    Remove banner
                  </button>
                ) : null}
              </div>
            </div>
          </div>

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
      
      <div
        className="glass-card"
        style={{
          marginTop: "24px",
          padding: 0,
          overflow: "hidden",
          borderColor: "color-mix(in srgb, var(--destructive) 22%, var(--border-color))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            padding: "var(--spacing-5)",
            background: "color-mix(in srgb, var(--destructive) 5%, transparent)",
            borderBottom: "1px solid color-mix(in srgb, var(--destructive) 12%, var(--border-color))",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "22px", color: "var(--destructive)", flexShrink: 0 }}
          >
            gpp_maybe
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--destructive)" }}>
              Danger zone
            </span>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
              Irreversible or high-impact actions for this tournament.
            </p>
          </div>
        </div>
        <div style={{ padding: "var(--spacing-5)" }}>
          <TournamentCancelDangerZone tournament={tournament} org={org} onUpdate={onUpdate} />
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 12px" }}>
            Permanently delete this tournament and all its data. This cannot be undone.
          </p>
          <TournamentDeleteDangerZone tournament={tournament} org={org} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
