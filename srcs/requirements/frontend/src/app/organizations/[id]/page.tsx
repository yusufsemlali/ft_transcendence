"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api/api";

import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Tournament, Sport } from "@ft-transcendence/contracts";

interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  visibility: "public" | "private";
  createdAt: string;
  updatedAt: string;
  stats: { memberCount: number; totalTournaments: number; activeTournaments: number };
}

interface Member {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
  xp: number;
  level: number;
  isOnline: boolean;
  orgRole: string;
  joinedAt: string;
}

/* ─── Add Member Modal ─── */
function AddMemberModal({
  orgId,
  onClose,
  onAdded,
}: {
  orgId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!email.trim()) { toast.error("Email is required"); return; }
    setAdding(true);
    try {
      const res = await api.organizations.addMember({
        params: { id: orgId },
        body: { email: email.trim(), role: role as any },
      });
      if (res.status === 201) {
        toast.success("Member added!");
        onAdded();
        onClose();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
          <span className="text-sm font-mono font-bold uppercase tracking-widest">Add Member</span>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted/50">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="input h-10 px-3 w-full border border-border/50 focus:border-primary/50 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 w-full text-sm font-mono rounded-sm bg-muted/50 border border-border/50 text-foreground"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-primary text-primary-foreground hover:bg-primary/80 transition-all disabled:opacity-50"
          >
            {adding ? "adding..." : "add member"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Edit Org Modal ─── */
function EditOrgModal({
  org,
  onClose,
  onUpdated,
}: {
  org: OrgProfile;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description || "");
  const [visibility, setVisibility] = useState(org.visibility);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.organizations.updateOrganization({
        params: { id: org.id },
        body: { name: name.trim() || undefined, description: description.trim() || undefined, visibility },
      });
      if (res.status === 200) {
        toast.success("Organization updated!");
        onUpdated();
        onClose();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
          <span className="text-sm font-mono font-bold uppercase tracking-widest">Edit Organization</span>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted/50">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input h-10 px-3 w-full border border-border/50 focus:border-primary/50 text-sm font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input px-3 py-2 w-full border border-border/50 focus:border-primary/50 text-sm font-mono resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Visibility</label>
            <div className="flex gap-2">
              {(["public", "private"] as const).map((v) => (
                <button key={v} onClick={() => setVisibility(v)} className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all flex-1 ${visibility === v ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-primary text-primary-foreground hover:bg-primary/80 transition-all disabled:opacity-50">
            {saving ? "saving..." : "save changes"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Member Row ─── */
function MemberRow({
  member,
  orgId,
  onChangeRole,
  onRemove,
}: {
  member: Member;
  orgId: string;
  onChangeRole: (userId: string, role: string) => void;
  onRemove: (userId: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-b border-border/10 hover:bg-muted/30 transition-all group last:border-0">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-sm bg-muted overflow-hidden ring-1 ring-border/50">
          <img src={member.avatar || "/default-avatar.png"} alt={member.username} className="w-full h-full object-cover" />
        </div>
        {member.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background shadow-[0_0_8px_#4ade80]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground text-sm truncate">{member.displayName || member.username}</span>
          <span className="text-[10px] font-mono text-muted-foreground/60">@{member.username}</span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mt-0.5">
          LVL {member.level} · Joined {new Date(member.joinedAt).toLocaleDateString()}
        </div>
      </div>
      <Badge variant={member.orgRole === "owner" ? "destructive" : member.orgRole === "admin" ? "outline" : "default"}>
        {member.orgRole}
      </Badge>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {member.orgRole !== "owner" && (
          <>
            <select
              defaultValue={member.orgRole}
              onChange={(e) => onChangeRole(member.id, e.target.value)}
              className="px-2 py-1 text-[10px] font-mono rounded-sm bg-muted/50 border border-border/50 text-foreground"
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <button
              onClick={() => onRemove(member.id)}
              className="p-1.5 rounded-sm hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove member"
            >
              <span className="material-symbols-outlined text-base">person_remove</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Create Tournament Modal ─── */
function CreateTournamentModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [sports, setSports] = useState<Sport[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    sportId: "",
    name: "",
    description: "",
    bracketType: "single_elimination" as string,
    mode: "1v1" as string,
    minTeamSize: 1,
    maxTeamSize: 1,
    allowDraws: false,
    requiredHandleType: "",
    minParticipants: 2,
    maxParticipants: 16,
    prizePool: "",
  });

  useEffect(() => {
    api.sports.getSports({}).then((res) => {
      if (res.status === 200) {
        setSports(res.body);
        if (res.body.length > 0) setForm((f) => ({ ...f, sportId: res.body[0].id }));
      }
    });
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.sportId) return;
    setSubmitting(true);
    try {
      const res = await api.tournaments.createTournament({
        params: { organizationId: orgId },
        body: {
          ...form,
          requiredHandleType: form.requiredHandleType || null,
          prizePool: form.prizePool || undefined,
          description: form.description || undefined,
        } as any,
      });
      if (res.status === 201) {
        toast.success("Tournament created!");
        onCreated();
        onClose();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
          <span className="text-sm font-mono font-bold uppercase tracking-widest">Create Tournament</span>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted/50">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input h-10 px-3 w-full rounded-lg bg-muted/30 border border-border/30 focus:border-primary/50 text-sm font-mono" placeholder="Tournament name" />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input px-3 py-2 w-full rounded-lg bg-muted/30 border border-border/30 focus:border-primary/50 text-sm font-mono resize-none" placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Sport</label>
              <select value={form.sportId} onChange={(e) => setForm({ ...form, sportId: e.target.value })} className="input h-10 w-full rounded-lg bg-muted/30 border border-border/30 text-sm font-mono">
                {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Bracket</label>
              <select value={form.bracketType} onChange={(e) => setForm({ ...form, bracketType: e.target.value })} className="input h-10 w-full rounded-lg bg-muted/30 border border-border/30 text-sm font-mono">
                {["single_elimination", "double_elimination", "round_robin", "swiss", "free_for_all"].map((b) => <option key={b} value={b}>{b.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Mode</label>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="input h-10 w-full rounded-lg bg-muted/30 border border-border/30 text-sm font-mono">
                {["1v1", "team", "ffa"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Min Players</label>
              <input type="number" min={2} value={form.minParticipants} onChange={(e) => setForm({ ...form, minParticipants: Number(e.target.value) })} className="input h-10 w-full rounded-lg bg-muted/30 border border-border/30 text-sm font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Max Players</label>
              <input type="number" min={2} value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })} className="input h-10 w-full rounded-lg bg-muted/30 border border-border/30 text-sm font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Min Team Size</label>
              <input type="number" min={1} value={form.minTeamSize} onChange={(e) => setForm({ ...form, minTeamSize: Number(e.target.value) })} className="input h-10 w-full rounded-lg bg-muted/30 border border-border/30 text-sm font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Max Team Size</label>
              <input type="number" min={1} value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })} className="input h-10 w-full rounded-lg bg-muted/30 border border-border/30 text-sm font-mono" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">Prize Pool</label>
            <input value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} className="input h-10 px-3 w-full rounded-lg bg-muted/30 border border-border/30 focus:border-primary/50 text-sm font-mono" placeholder="e.g. $500 (optional)" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.allowDraws} onChange={(e) => setForm({ ...form, allowDraws: e.target.checked })} className="rounded border-border" />
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Allow Draws</span>
          </label>
          <button onClick={handleCreate} disabled={submitting || !form.name.trim()} className="w-full py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-all disabled:opacity-50">
            {submitting ? "creating..." : "create tournament"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft: "outline",
  registration: "success",
  upcoming: "outline",
  ongoing: "destructive",
  completed: "default",
  cancelled: "destructive",
};

/* ─── Main Page ─── */
export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCreateTournament, setShowCreateTournament] = useState(false);

  const loadOrg = async () => {
    try {
      const res = await api.organizations.getOrganization({ params: { id: orgId } });
      if (res.status === 200) {
        setOrg(res.body.data as any);
      } else {
        toast.error("Organization not found");
      }
    } catch {
      toast.error("Failed to load organization");
    }
  };

  const loadMembers = async () => {
    try {
      const res = await api.organizations.getOrganizationMembers({ params: { id: orgId } });
      if (res.status === 200) {
        setMembers(res.body.data as any);
      }
    } catch {
      /* ignore */
    }
  };

  const loadTournaments = async () => {
    try {
      const res = await api.tournaments.listOrgTournaments({ params: { organizationId: orgId } });
      if (res.status === 200) {
        setTournaments(res.body as any);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    Promise.all([loadOrg(), loadMembers(), loadTournaments()]).finally(() => setLoading(false));
  }, [orgId]);

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm("Delete this tournament?")) return;
    try {
      const res = await api.tournaments.deleteTournament({ params: { organizationId: orgId, id: tournamentId } });
      if (res.status === 200) {
        toast.success("Tournament deleted");
        loadTournaments();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to delete tournament");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this organization? This cannot be undone.")) return;
    try {
      const res = await api.organizations.deleteOrganization({ params: { id: orgId }, body: {} });
      if (res.status === 200) {
        toast.success("Organization deleted");
        router.push("/organizations");
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to delete organization");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Leave this organization?")) return;
    try {
      const res = await api.organizations.leaveOrganization({ params: { id: orgId }, body: {} });
      if (res.status === 200) {
        toast.success("You left the organization");
        router.push("/organizations");
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to leave organization");
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      const res = await api.organizations.updateMemberRole({
        params: { id: orgId, userId },
        body: { role: role as any },
      });
      if (res.status === 200) {
        toast.success("Role updated");
        loadMembers();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await api.organizations.removeMember({
        params: { id: orgId, userId },
        body: {},
      });
      if (res.status === 200) {
        toast.success("Member removed");
        loadMembers();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  if (loading) {
    return (
      <Page>
        <Stack gap="xl">
          <Section title="organization" icon="corporate_fare">
            <Card className="p-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <div className="flex gap-4 mt-6">
                  <Skeleton className="h-20 w-32" />
                  <Skeleton className="h-20 w-32" />
                  <Skeleton className="h-20 w-32" />
                </div>
              </div>
            </Card>
          </Section>
        </Stack>
      </Page>
    );
  }

  if (!org) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-40">
          <span className="material-symbols-outlined text-6xl">domain_disabled</span>
          <span className="text-xs font-mono uppercase tracking-[0.4em]">Organization not found</span>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Stack gap="xl">
        {/* Org Header */}
        <Section title={org.name} icon="corporate_fare"
          actions={
            <div className="flex gap-2">
              <button onClick={() => setShowEdit(true)} className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-muted/50 hover:bg-muted transition-colors">edit</button>
              <button onClick={handleLeave} className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors">leave</button>
              <button onClick={handleDelete} className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">delete</button>
            </div>
          }
        >
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-border/50">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="w-full h-full rounded-sm object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-2xl">corporate_fare</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground/60">/{org.slug}</span>
                  <Badge variant={org.visibility === "public" ? "success" : "outline"}>{org.visibility}</Badge>
                </div>
                {org.description && <p className="text-sm text-muted-foreground mt-2">{org.description}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Members", value: org.stats.memberCount, color: "text-foreground" },
                { label: "Tournaments", value: org.stats.totalTournaments, color: "text-foreground" },
                { label: "Active", value: org.stats.activeTournaments, color: "text-green-400" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{s.label}</div>
                  <div className={`text-2xl font-black font-mono tracking-tighter ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* Members */}
        <Section title="members" icon="group"
          actions={
            <button
              onClick={() => setShowAddMember(true)}
              className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-primary text-primary-foreground hover:bg-primary/80 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              add member
            </button>
          }
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 opacity-30">
                  <span className="material-symbols-outlined text-5xl">group_off</span>
                  <span className="text-xs font-mono uppercase tracking-[0.4em]">No members found</span>
                </div>
              ) : (
                members.map((m) => (
                  <MemberRow key={m.id} member={m} orgId={orgId} onChangeRole={handleChangeRole} onRemove={handleRemoveMember} />
                ))
              )}
            </CardContent>
          </Card>
        </Section>
        {/* Tournaments */}
        <Section title="tournaments" icon="emoji_events"
          actions={
            <button
              onClick={() => setShowCreateTournament(true)}
              className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              new tournament
            </button>
          }
        >
          {tournaments.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                <span className="material-symbols-outlined text-5xl">emoji_events</span>
                <span className="text-xs font-mono uppercase tracking-[0.4em]">No tournaments yet</span>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((t) => (
                <Card key={t.id} className="overflow-hidden group hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <a href={`/tournaments/${t.id}`} className="font-bold text-foreground text-sm hover:text-primary transition-colors truncate block">
                          {t.name}
                        </a>
                        <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                          {t.mode} · {t.bracketType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={(STATUS_COLORS[t.status] || "default") as any}>{t.status}</Badge>
                        <button onClick={() => handleDeleteTournament(t.id)} className="p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{t.description}</p>}
                    <div className="flex gap-4 text-[10px] font-mono text-muted-foreground/50">
                      <span>Players: {t.minParticipants}-{t.maxParticipants}</span>
                      <span>Team: {t.minTeamSize}v{t.maxTeamSize}</span>
                      {t.prizePool && <span className="text-green-400">{t.prizePool}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </Stack>

      {showAddMember && <AddMemberModal orgId={orgId} onClose={() => setShowAddMember(false)} onAdded={loadMembers} />}
      {showEdit && <EditOrgModal org={org} onClose={() => setShowEdit(false)} onUpdated={loadOrg} />}
      {showCreateTournament && <CreateTournamentModal orgId={orgId} onClose={() => setShowCreateTournament(false)} onCreated={loadTournaments} />}
    </Page>
  );
}
