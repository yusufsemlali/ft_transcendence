"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/api";
import { User, Session } from "@ft-transcendence/contracts";

import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type RoleFilter = "all" | "user" | "admin" | "moderator" | "organizer";
type StatusFilter = "all" | "active" | "suspended" | "banned" | "muted";

/* ─────────────── User Row ─────────────── */
function UserRow({
  user,
  onChangeRole,
  onChangeStatus,
  onDelete,
  onViewSessions,
}: {
  user: User;
  onChangeRole: (id: string, role: string) => void;
  onChangeStatus: (id: string, status: string, reason?: string) => void;
  onDelete: (id: string) => void;
  onViewSessions: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="border-b border-border/10 last:border-0">
      <div className="flex items-center gap-4 py-4 px-6 hover:bg-muted/30 transition-all group">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-sm bg-muted overflow-hidden ring-1 ring-border/50">
            <img
              src={user.avatar || "/default-avatar.png"}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>
          {user.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background shadow-[0_0_8px_#4ade80]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm truncate">
              {user.displayName || user.username}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/60">
              @{user.username}
            </span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mt-0.5">
            {user.email} · LVL {user.level} · ELO {user.eloRating}
          </div>
        </div>

        <Badge variant={user.role === "admin" ? "destructive" : user.role === "moderator" ? "outline" : "default"}>
          {user.role}
        </Badge>
        <Badge variant={user.status === "active" ? "success" : user.status === "banned" ? "destructive" : "outline"}>
          {user.status}
        </Badge>

        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1.5 rounded-sm hover:bg-muted/50 text-muted-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-base">more_vert</span>
        </button>
      </div>

      {showActions && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          <select
            defaultValue={user.role}
            onChange={(e) => { onChangeRole(user.id, e.target.value); setShowActions(false); }}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded-sm bg-muted/50 border border-border/50 text-foreground"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
            <option value="moderator">moderator</option>
            <option value="organizer">organizer</option>
          </select>
          <select
            defaultValue={user.status}
            onChange={(e) => { onChangeStatus(user.id, e.target.value); setShowActions(false); }}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded-sm bg-muted/50 border border-border/50 text-foreground"
          >
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="banned">banned</option>
            <option value="muted">muted</option>
          </select>
          <button
            onClick={() => { onViewSessions(user.id); setShowActions(false); }}
            className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            sessions
          </button>
          <button
            onClick={() => { onDelete(user.id); setShowActions(false); }}
            className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────── Session Modal ─────────── */
function SessionsModal({
  sessions,
  userId,
  onClose,
  onRevoke,
  onRevokeAll,
}: {
  sessions: Session[];
  userId: string;
  onClose: () => void;
  onRevoke: (userId: string, sessionId: string) => void;
  onRevokeAll: (userId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
          <span className="text-sm font-mono font-bold uppercase tracking-widest">Active Sessions</span>
          <div className="flex gap-2">
            <button
              onClick={() => onRevokeAll(userId)}
              className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              revoke all
            </button>
            <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted/50">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
        <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-40">
              <span className="material-symbols-outlined text-4xl">devices</span>
              <span className="text-[10px] font-mono uppercase tracking-widest mt-2">No active sessions</span>
            </div>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 py-3 px-6 border-b border-border/10 last:border-0 hover:bg-muted/30">
                <span className="material-symbols-outlined text-muted-foreground text-base">
                  {s.deviceType === "mobile" ? "smartphone" : s.deviceType === "tablet" ? "tablet" : "computer"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">
                    {s.browserName || "Unknown"} {s.browserVersion || ""} · {s.osName || "Unknown"}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/60">
                    {s.ipAddress || "—"} · {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => onRevoke(userId, s.id)}
                  className="p-1.5 rounded-sm hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  title="Revoke session"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-b border-border/10">
      <Skeleton className="w-10 h-10 rounded-sm" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-5 w-16 rounded-sm" />
      <Skeleton className="h-5 w-16 rounded-sm" />
    </div>
  );
}

/* ─────────── Main Page ─────────── */
export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Sessions modal
  const [sessionsUserId, setSessionsUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query: any = { page, pageSize: 20 };
      if (search) query.search = search;
      if (roleFilter !== "all") query.role = roleFilter;
      if (statusFilter !== "all") query.status = statusFilter;

      const res = await api.admin.getUsers({ query });
      if (res.status === 200) {
        setUsers(res.body.users);
        setTotalPages(res.body.totalPages);
        setTotal(res.body.total);
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      const res = await api.admin.updateUserRole({
        params: { id: userId },
        body: { role: role as any },
      });
      if (res.status === 200) {
        toast.success(`Role updated to ${role}`);
        loadUsers();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleChangeStatus = async (userId: string, status: string, reason?: string) => {
    try {
      const res = await api.admin.updateUserStatus({
        params: { id: userId },
        body: { status: status as any, reason },
      });
      if (res.status === 200) {
        toast.success(`Status updated to ${status}`);
        loadUsers();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    try {
      const res = await api.admin.deleteUser({
        params: { id: userId },
        body: {},
      });
      if (res.status === 200) {
        toast.success("User deleted");
        loadUsers();
      } else {
        const err = res.body as { message: string };
        toast.error(err.message);
      }
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleViewSessions = async (userId: string) => {
    setSessionsUserId(userId);
    setLoadingSessions(true);
    try {
      const res = await api.admin.getUserSessions({ params: { id: userId } });
      if (res.status === 200) {
        setSessions(res.body);
      }
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (userId: string, sessionId: string) => {
    try {
      const res = await api.admin.revokeUserSession({
        params: { id: userId, sessionId },
        body: {},
      });
      if (res.status === 200) {
        toast.success("Session revoked");
        handleViewSessions(userId);
      }
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const handleRevokeAllSessions = async (userId: string) => {
    if (!confirm("Revoke all sessions for this user?")) return;
    try {
      const res = await api.admin.revokeAllUserSessions({
        params: { id: userId },
        body: {},
      });
      if (res.status === 200) {
        toast.success("All sessions revoked");
        handleViewSessions(userId);
      }
    } catch {
      toast.error("Failed to revoke sessions");
    }
  };

  const roleFilters: RoleFilter[] = ["all", "user", "admin", "moderator", "organizer"];
  const statusFilters: StatusFilter[] = ["all", "active", "suspended", "banned", "muted"];

  return (
    <Page>
      <Stack gap="xl">
        {/* Stats */}
        <Section title="admin panel" icon="admin_panel_settings">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: total, color: "text-foreground" },
              { label: "Active", value: users.filter((u) => u.status === "active").length, color: "text-green-400" },
              { label: "Suspended", value: users.filter((u) => u.status === "suspended").length, color: "text-yellow-400" },
              { label: "Banned", value: users.filter((u) => u.status === "banned").length, color: "text-destructive" },
            ].map((stat) => (
              <Card key={stat.label} size="sm" className="flex flex-col items-center text-center group hover:border-primary/30">
                <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
                  {stat.label}
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-12 my-1" />
                ) : (
                  <div className={`text-3xl font-black font-mono tracking-tighter ${stat.color}`}>
                    {stat.value}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Section>

        {/* Users Table */}
        <Section title="user management" icon="group">
          <Card className="overflow-hidden">
            {/* Search + Filters */}
            <div className="px-6 pt-4 pb-2 space-y-3 border-b border-border/10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by username or email..."
                  className="input h-10 pl-10 pr-4 w-full border border-border/50 focus:border-primary/50 text-sm font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mr-1">Role:</span>
                  {roleFilters.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRoleFilter(r); setPage(1); }}
                      className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all ${
                        roleFilter === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mr-1">Status:</span>
                  {statusFilters.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setPage(1); }}
                      className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all ${
                        statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="flex flex-col min-h-[400px]">
                {loading ? (
                  Array(5).fill(0).map((_, i) => <RowSkeleton key={i} />)
                ) : users.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 opacity-30">
                    <span className="material-symbols-outlined text-6xl">person_off</span>
                    <span className="text-xs font-mono uppercase tracking-[0.4em]">No users found</span>
                  </div>
                ) : (
                  users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onChangeRole={handleChangeRole}
                      onChangeStatus={handleChangeStatus}
                      onDelete={handleDelete}
                      onViewSessions={handleViewSessions}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-border/10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-muted/50 hover:bg-muted disabled:opacity-30 transition-all"
                  >
                    prev
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-muted/50 hover:bg-muted disabled:opacity-30 transition-all"
                  >
                    next
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </Stack>

      {/* Sessions Modal */}
      {sessionsUserId && !loadingSessions && (
        <SessionsModal
          sessions={sessions}
          userId={sessionsUserId}
          onClose={() => setSessionsUserId(null)}
          onRevoke={handleRevokeSession}
          onRevokeAll={handleRevokeAllSessions}
        />
      )}
    </Page>
  );
}
