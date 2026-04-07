"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api/api";
import type { User, Session, Sport } from "@ft-transcendence/contracts";

type Tab = "users" | "sports";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Gate: only admin/moderator
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "moderator") {
      router.replace("/");
    }
  }, [user, router]);

  const [tab, setTab] = useState<Tab>("users");

  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return (
      <div className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "var(--text-muted)", opacity: 0.2 }}>shield</span>
          <p style={{ color: "var(--text-muted)", marginTop: "16px", fontSize: "14px" }}>Checking permissions…</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "users", label: "Users", icon: "group" },
    ...(user.role === "admin" ? [{ id: "sports" as Tab, label: "Sports", icon: "sports_esports" }] : []),
  ];

  return (
    <div className="page" style={{ minHeight: "100vh", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "300", margin: 0 }}>Administration</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Manage platform users and sport blueprints</p>
        </div>
        <div className="glass" style={{ padding: "4px 12px", borderRadius: "24px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid var(--border-color)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-primary)" }}>verified_user</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{user.role}</span>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "0" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "10px 20px", fontSize: "13px", fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "var(--accent-primary)" : "var(--text-muted)",
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: tab === t.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in" key={tab}>
        {tab === "users" && <UsersTab userRole={user.role} />}
        {tab === "sports" && <SportsTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   USERS TAB
   ═══════════════════════════════════════════════════════ */

function UsersTab({ userRole }: { userRole: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query: any = { page, pageSize: 15 };
      if (search) query.search = search;
      if (roleFilter) query.role = roleFilter;
      if (statusFilter) query.status = statusFilter;
      const res = await api.admin.getUsers({ query });
      if (res.status === 200) {
        setUsers(res.body.users);
        setTotalPages(res.body.totalPages);
        setTotal(res.body.total);
      }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await api.admin.updateUserRole({ params: { id: userId }, body: { role: role as any } });
      if (res.status === 200) { toast.success("Role updated"); fetchUsers(); }
      else toast.error((res.body as any).message || "Failed");
    } catch { toast.error("Error updating role"); }
  };

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      const res = await api.admin.updateUserStatus({ params: { id: userId }, body: { status: status as any } });
      if (res.status === 200) { toast.success("Status updated"); fetchUsers(); }
      else toast.error((res.body as any).message || "Failed");
    } catch { toast.error("Error updating status"); }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Permanently delete user "${username}"? This cannot be undone.`)) return;
    try {
      const res = await api.admin.deleteUser({ params: { id: userId }, body: {} });
      if (res.status === 200) { toast.success("User deleted"); fetchUsers(); }
      else toast.error((res.body as any).message || "Failed");
    } catch { toast.error("Error deleting user"); }
  };

  const loadSessions = async (userId: string) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    setSessionsLoading(true);
    try {
      const res = await api.admin.getUserSessions({ params: { id: userId } });
      if (res.status === 200) setSessions(res.body);
      else setSessions([]);
    } catch { setSessions([]); }
    finally { setSessionsLoading(false); }
  };

  const revokeSession = async (userId: string, sessionId: string) => {
    try {
      const res = await api.admin.revokeUserSession({ params: { id: userId, sessionId }, body: {} });
      if (res.status === 200) { toast.success("Session revoked"); loadSessions(userId); }
    } catch { toast.error("Failed to revoke session"); }
  };

  const revokeAll = async (userId: string) => {
    try {
      const res = await api.admin.revokeAllUserSessions({ params: { id: userId }, body: {} });
      if (res.status === 200) { toast.success("All sessions revoked"); loadSessions(userId); }
    } catch { toast.error("Failed to revoke sessions"); }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "var(--accent-success)";
      case "suspended": return "var(--accent-warning)";
      case "banned": return "var(--accent-error)";
      case "muted": return "var(--text-muted)";
      default: return "var(--text-muted)";
    }
  };

  const roleColor = (r: string) => {
    switch (r) {
      case "admin": return "var(--accent-error)";
      case "moderator": return "var(--accent-warning)";
      case "organizer": return "var(--accent-info)";
      default: return "var(--text-muted)";
    }
  };

  return (
    <div>
      {/* Search + Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div className="glass" style={{ flex: "1 1 240px", display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>search</span>
          <input
            type="text"
            placeholder="Search by username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--text-primary)", outline: "none", width: "100%", fontSize: "13px" }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="input"
          style={{ width: "auto", minWidth: "130px", fontSize: "12px", padding: "8px 12px" }}
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="organizer">Organizer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input"
          style={{ width: "auto", minWidth: "130px", fontSize: "12px", padding: "8px 12px" }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="muted">Muted</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
        {total} user{total !== 1 ? "s" : ""} found · Page {page}/{totalPages}
      </div>

      {/* User List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card" style={{ padding: "20px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--border-color)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "14px", width: "30%", background: "var(--border-color)", borderRadius: "4px", marginBottom: "8px" }} />
                  <div style={{ height: "10px", width: "50%", background: "var(--border-color)", borderRadius: "4px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", border: "1px solid var(--border-color)", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", opacity: 0.2 }}>person_off</span>
          <p style={{ color: "var(--text-muted)", marginTop: "12px", fontSize: "13px" }}>No users found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {users.map((u) => (
            <div key={u.id}>
              <div
                className="glass-card"
                style={{ padding: "16px 20px", border: "1px solid var(--border-color)", cursor: "pointer", transition: "all 0.15s" }}
                onClick={() => loadSessions(u.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                  {/* Avatar */}
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                    background: u.avatar ? `url(${u.avatar}) center/cover` : "var(--bg-secondary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid var(--border-color)",
                  }}>
                    {!u.avatar && <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--text-muted)" }}>person</span>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{u.username}</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: `color-mix(in srgb, ${roleColor(u.role)}, transparent 85%)`, color: roleColor(u.role), textTransform: "uppercase", letterSpacing: "0.5px" }}>{u.role}</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: `color-mix(in srgb, ${statusColor(u.status)}, transparent 85%)`, color: statusColor(u.status), textTransform: "uppercase", letterSpacing: "0.5px" }}>{u.status}</span>
                      {u.isOnline && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-success)", boxShadow: "0 0 6px var(--accent-success)" }} />}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                      {u.email} · LVL {u.level} · {u.eloRating} ELO · Joined {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                    {userRole === "admin" && (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="input"
                        style={{ width: "auto", fontSize: "11px", padding: "4px 8px", minWidth: "100px" }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="organizer">Organizer</option>
                      </select>
                    )}
                    <select
                      value={u.status}
                      onChange={(e) => handleStatusChange(u.id, e.target.value)}
                      className="input"
                      style={{ width: "auto", fontSize: "11px", padding: "4px 8px", minWidth: "100px" }}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="banned">Banned</option>
                      <option value="muted">Muted</option>
                    </select>
                    {userRole === "admin" && (
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        style={{ background: "color-mix(in srgb, var(--accent-error), transparent 88%)", color: "var(--accent-error)", border: "1px solid color-mix(in srgb, var(--accent-error), transparent 70%)", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded: Sessions */}
              {expandedUser === u.id && (
                <div className="animate-fade-in" style={{ marginLeft: "24px", marginTop: "4px", padding: "16px", borderLeft: "2px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Active Sessions</span>
                    {sessions.length > 0 && (
                      <button onClick={() => revokeAll(u.id)} style={{ fontSize: "11px", color: "var(--accent-error)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                        Revoke All
                      </button>
                    )}
                  </div>
                  {sessionsLoading ? (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Loading…</p>
                  ) : sessions.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No active sessions</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {sessions.map((s) => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", fontSize: "12px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>
                            {s.deviceType === "mobile" ? "smartphone" : "computer"}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ color: "var(--text-primary)" }}>{s.browserName || "Unknown"} {s.browserVersion || ""}</span>
                            <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>{s.osName || ""} · {s.ipAddress || ""}</span>
                          </div>
                          <button onClick={() => revokeSession(u.id, s.id)} style={{ fontSize: "10px", color: "var(--accent-error)", background: "transparent", border: "none", cursor: "pointer" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="btn btn-secondary"
            style={{ padding: "6px 14px", fontSize: "12px", opacity: page <= 1 ? 0.4 : 1 }}
          >
            Previous
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: "12px", color: "var(--text-muted)" }}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="btn btn-secondary"
            style={{ padding: "6px 14px", fontSize: "12px", opacity: page >= totalPages ? 0.4 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SPORTS TAB
   ═══════════════════════════════════════════════════════ */

function SportsTab() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "esports" as "esports" | "physical" | "tabletop",
    scoringType: "points_high" as string,
    mode: "1v1" as "1v1" | "team" | "ffa",
    requiredHandleType: "",
    defaultMinTeamSize: 1,
    defaultMaxTeamSize: 5,
    defaultHasDraws: false,
    tournamentConfigSchema: {},
    matchConfigSchema: {},
  });

  const fetchSports = async () => {
    setLoading(true);
    try {
      const res = await api.sports.getSports();
      if (res.status === 200) setSports(res.body);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSports(); }, []);

  const openCreate = () => {
    setEditingSport(null);
    setForm({ name: "", category: "esports", scoringType: "points_high", mode: "1v1", requiredHandleType: "", defaultMinTeamSize: 1, defaultMaxTeamSize: 5, defaultHasDraws: false, tournamentConfigSchema: {}, matchConfigSchema: {} });
    setShowModal(true);
  };

  const openEdit = (sport: Sport) => {
    setEditingSport(sport);
    setForm({
      name: sport.name,
      category: sport.category as any,
      scoringType: sport.scoringType,
      mode: sport.mode as any,
      requiredHandleType: sport.requiredHandleType || "",
      defaultMinTeamSize: sport.defaultMinTeamSize || 1,
      defaultMaxTeamSize: sport.defaultMaxTeamSize || 5,
      defaultHasDraws: sport.defaultHasDraws,
      tournamentConfigSchema: sport.tournamentConfigSchema || {},
      matchConfigSchema: sport.matchConfigSchema || {},
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = {
      ...form,
      requiredHandleType: form.requiredHandleType || null,
      defaultMinTeamSize: Number(form.defaultMinTeamSize),
      defaultMaxTeamSize: Number(form.defaultMaxTeamSize),
    };
    try {
      if (editingSport) {
        const res = await api.sports.update({ params: { id: editingSport.id }, body });
        if (res.status === 200) { toast.success("Sport updated"); setShowModal(false); fetchSports(); }
        else toast.error((res.body as any).message || "Failed");
      } else {
        const res = await api.sports.create({ body });
        if (res.status === 201) { toast.success("Sport created"); setShowModal(false); fetchSports(); }
        else toast.error((res.body as any).message || "Failed");
      }
    } catch { toast.error("Error saving sport"); }
  };

  const handleDeleteSport = async (id: string, name: string) => {
    if (!confirm(`Delete sport "${name}"?`)) return;
    try {
      const res = await api.sports.delete({ params: { id } });
      if (res.status === 204) { toast.success("Sport deleted"); fetchSports(); }
      else toast.error("Failed to delete");
    } catch { toast.error("Error deleting sport"); }
  };

  const categoryIcon = (c: string) => {
    switch (c) { case "esports": return "sports_esports"; case "physical": return "sports_soccer"; case "tabletop": return "casino"; default: return "sports"; }
  };

  const modeColor = (m: string) => {
    switch (m) { case "1v1": return "var(--accent-primary)"; case "team": return "var(--accent-info)"; case "ffa": return "var(--accent-warning)"; default: return "var(--text-muted)"; }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{sports.length} sport blueprint{sports.length !== 1 ? "s" : ""}</span>
        <button onClick={openCreate} className="btn btn-primary" style={{ fontSize: "12px", padding: "8px 16px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
          New Sport
        </button>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card" style={{ padding: "24px", border: "1px solid var(--border-color)", height: "140px" }} />
          ))}
        </div>
      ) : sports.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", border: "1px solid var(--border-color)", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", opacity: 0.2 }}>sports</span>
          <p style={{ color: "var(--text-muted)", marginTop: "12px", fontSize: "13px" }}>No sports configured yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {sports.map((sport) => (
            <div key={sport.id} className="glass-card" style={{ padding: "0", border: "1px solid var(--border-color)", overflow: "hidden", transition: "transform 0.15s", cursor: "pointer" }} onClick={() => openEdit(sport)}>
              {/* Mode color strip */}
              <div style={{ height: "3px", background: modeColor(sport.mode) }} />
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "color-mix(in srgb, var(--accent-primary), transparent 88%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent-primary)" }}>{categoryIcon(sport.category)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{sport.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{sport.category} · {sport.scoringType.replace("_", " ")}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSport(sport.id, sport.name); }}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: `color-mix(in srgb, ${modeColor(sport.mode)}, transparent 85%)`, color: modeColor(sport.mode), textTransform: "uppercase" }}>{sport.mode}</span>
                  {sport.requiredHandleType && (
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>{sport.requiredHandleType}</span>
                  )}
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>{sport.defaultMinTeamSize}–{sport.defaultMaxTeamSize} players</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowModal(false)}>
          <div className="glass-card" style={{ width: "min(520px, 90vw)", maxHeight: "85vh", overflow: "auto", padding: "32px", border: "1px solid var(--border-color)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{editingSport ? "Edit Sport" : "Create Sport"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stack-md">
              <div>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>NAME</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. League of Legends" required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>CATEGORY</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
                    <option value="esports">Esports</option>
                    <option value="physical">Physical</option>
                    <option value="tabletop">Tabletop</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>MODE</label>
                  <select className="input" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as any })}>
                    <option value="1v1">1v1</option>
                    <option value="team">Team</option>
                    <option value="ffa">FFA</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>SCORING TYPE</label>
                  <select className="input" value={form.scoringType} onChange={(e) => setForm({ ...form, scoringType: e.target.value })}>
                    <option value="points_high">Points High</option>
                    <option value="time_low">Time Low</option>
                    <option value="sets">Sets</option>
                    <option value="binary">Binary</option>
                    <option value="stocks">Stocks</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>HANDLE TYPE</label>
                  <select className="input" value={form.requiredHandleType} onChange={(e) => setForm({ ...form, requiredHandleType: e.target.value })}>
                    <option value="">None</option>
                    <option value="riot_id">Riot ID</option>
                    <option value="steam_id">Steam ID</option>
                    <option value="psn_id">PSN ID</option>
                    <option value="xbox_id">Xbox ID</option>
                    <option value="battlenet_id">Battle.net ID</option>
                    <option value="epic_id">Epic ID</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>MIN TEAM</label>
                  <input className="input" type="number" min={1} value={form.defaultMinTeamSize} onChange={(e) => setForm({ ...form, defaultMinTeamSize: +e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>MAX TEAM</label>
                  <input className="input" type="number" min={1} value={form.defaultMaxTeamSize} onChange={(e) => setForm({ ...form, defaultMaxTeamSize: +e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>DRAWS</label>
                  <button
                    type="button"
                    className="input"
                    onClick={() => setForm({ ...form, defaultHasDraws: !form.defaultHasDraws })}
                    style={{ cursor: "pointer", textAlign: "left", color: form.defaultHasDraws ? "var(--accent-success)" : "var(--text-muted)" }}
                  >
                    {form.defaultHasDraws ? "Yes" : "No"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "16px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: "8px 20px", fontSize: "12px" }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 20px", fontSize: "12px" }}>
                  {editingSport ? "Save Changes" : "Create Sport"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
