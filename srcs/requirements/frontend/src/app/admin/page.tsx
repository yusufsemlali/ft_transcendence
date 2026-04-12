"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import api from "@/lib/api/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { User, Session, Sport } from "@ft-transcendence/contracts";

type UserRole = User["role"];
type UserStatus = User["status"];





/* ── Constants ── */
const ROLES: UserRole[] = ["user", "admin", "moderator", "organizer"];
const STATUSES: UserStatus[] = ["active", "suspended", "banned", "muted"];

const ROLE_META: Record<UserRole, { color: string; icon: string }> = {
  admin:     { color: "var(--destructive)",               icon: "shield" },
  moderator: { color: "var(--accent-warning, #f59e0b)",   icon: "shield_person" },
  organizer: { color: "var(--accent-info, #3b82f6)",      icon: "groups" },
  user:      { color: "var(--text-muted)",                 icon: "person" },
};

const STATUS_META: Record<UserStatus, { color: string; icon: string }> = {
  active:    { color: "var(--accent-success, #22c55e)", icon: "check_circle" },
  suspended: { color: "var(--accent-warning, #f59e0b)", icon: "pause_circle" },
  banned:    { color: "var(--destructive)",              icon: "block" },
  muted:     { color: "var(--text-muted)",               icon: "volume_off" },
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"users" | "organizations" | "sports">("users");

  interface OrgRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    visibility: "public" | "private";
    createdAt: string | Date;
    updatedAt: string | Date;
    deletedAt?: string | Date | null;
  }
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [orgTotal, setOrgTotal] = useState(0);
  const [orgPage, setOrgPage] = useState(1);
  const [orgTotalPages, setOrgTotalPages] = useState(1);
  const [orgSearch, setOrgSearch] = useState("");
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgRow | null>(null);
  const [showDeleteOrgModal, setShowDeleteOrgModal] = useState(false);


  const [sports, setSportsList] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showDeleteSportModal, setShowDeleteSportModal] = useState(false);
  const [sportForm, setSportForm] = useState<Partial<Sport>>({});

  const CATEGORIES = ["esports", "physical", "tabletop", "custom"];
  const MODES = ["1v1", "team", "ffa"];
  const SCORING = ["points_high", "time_low", "sets", "binary", "stocks"];
  const HANDLES = ["riot_id", "steam_id", "psn_id", "xbox_id", "battlenet_id", "nintendo_id", "uplay_id", "epic_id", "fide_id", "other", "generic_id"];

  /* ── Modals ── */
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [newStatus, setNewStatus] = useState<UserStatus>("active");
  const [statusReason, setStatusReason] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, string | number> = { page, pageSize: 20 };
      if (search) query.search = search;
      if (roleFilter) query.role = roleFilter;
      if (statusFilter) query.status = statusFilter;

      const res = await api.admin.getUsers({ query });
      if (res.status === 200) {
        setUsers(res.body.users as User[]);
        setTotal(res.body.total);
        setTotalPages(res.body.totalPages);
      }
    } catch { }
    finally { setLoading(false); }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchOrgs = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const query: Record<string, string | number> = { page: orgPage, pageSize: 20 };
      if (orgSearch) query.search = orgSearch;
      const res = await api.admin.getOrganizations({ query });
      if (res.status === 200) {
        setOrgs(res.body.organizations as OrgRow[]);
        setOrgTotal(res.body.total);
        setOrgTotalPages(res.body.totalPages);
      }
    } catch { /* ignore */ }
    finally { setOrgsLoading(false); }
  }, [orgPage, orgSearch]);

  const fetchSports = useCallback(async () => {
    setSportsLoading(true);
    try {
      const res = await api.sports.getSports();
      if (res.status === 200) setSportsList(res.body as Sport[]);
    } catch { }
    finally { setSportsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "organizations") fetchOrgs();
    if (activeTab === "sports") fetchSports();
  }, [activeTab, fetchOrgs, fetchSports]);

  const fetchSessions = async (userId: string) => {
    setSessionsLoading(true);
    try {
      const res = await api.admin.getUserSessions({ params: { id: userId } });
      if (res.status === 200) setSessions(res.body as Session[]);
    } catch { }
    finally { setSessionsLoading(false); }
  };

  const selectUser = (u: User) => {
    setSelectedUser(u);
    fetchSessions(u.id);
    setActionMessage(null);
  };

  /* ── Actions ── */
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.admin.updateUserRole({ params: { id: selectedUser.id }, body: { role: newRole } });
      if (res.status === 200) {
        setSelectedUser({ ...selectedUser, role: newRole });
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
        setActionMessage({ type: "success", text: `Role updated to ${newRole}` });
      } else { setActionMessage({ type: "error", text: (res.body as { message?: string })?.message || "Failed" }); }
    } catch { setActionMessage({ type: "error", text: "Network error" }); }
    setShowRoleModal(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    try {
      const body: { status: UserStatus; reason?: string } = { status: newStatus };
      if (statusReason) body.reason = statusReason;
      const res = await api.admin.updateUserStatus({ params: { id: selectedUser.id }, body });
      if (res.status === 200) {
        setSelectedUser({ ...selectedUser, status: newStatus });
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u));
        setActionMessage({ type: "success", text: `Status updated to ${newStatus}` });
      } else { setActionMessage({ type: "error", text: (res.body as { message?: string })?.message || "Failed" }); }
    } catch { setActionMessage({ type: "error", text: "Network error" }); }
    setShowStatusModal(false);
    setStatusReason("");
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.admin.deleteUser({ params: { id: selectedUser.id }, body: {} });
      if (res.status === 200) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        setSelectedUser(null);
        setActionMessage({ type: "success", text: "User deleted" });
      } else { setActionMessage({ type: "error", text: (res.body as { message?: string })?.message || "Failed" }); }
    } catch { setActionMessage({ type: "error", text: "Network error" }); }
    setShowDeleteModal(false);
  };

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return;
    try {
      const res = await api.admin.deleteOrganization({ params: { id: selectedOrg.id }, body: {} });
      if (res.status === 200) {
        setOrgs((prev) => prev.filter((o) => o.id !== selectedOrg.id));
        setSelectedOrg(null);
        setActionMessage({ type: "success", text: "Organization deleted" });
      } else {
        setActionMessage({ type: "error", text: (res.body as { message?: string })?.message || "Failed" });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error" });
    }
    setShowDeleteOrgModal(false);
  };

  const handleSaveSport = async () => {
    try {
      const isEdit = !!sportForm.id;
      const body = {
        ...sportForm,
        tournamentConfigSchema: sportForm.tournamentConfigSchema || {},
        matchConfigSchema: sportForm.matchConfigSchema || {},
      } as Sport;
      
      const res = isEdit
        ? await api.sports.update({ params: { id: sportForm.id! }, body })
        : await api.sports.create({ body });

      if (res.status === 200 || res.status === 201) {
        setActionMessage({ type: "success", text: `Sport ${isEdit ? "updated" : "created"}` });
        fetchSports();
        setShowSportModal(false);
      } else {
        setActionMessage({ type: "error", text: (res.body as { message?: string })?.message || "Failed" });
      }
    } catch { setActionMessage({ type: "error", text: "Network error" }); }
  };

  const handleDeleteSport = async () => {
    if (!selectedSport) return;
    try {
      const res = await api.sports.delete({ params: { id: selectedSport.id } });
      if (res.status === 204) {
        setSportsList((prev: Sport[]) => prev.filter((s: Sport) => s.id !== selectedSport.id));
        setSelectedSport(null);
        setActionMessage({ type: "success", text: "Sport deleted" });
      }
    } catch { setActionMessage({ type: "error", text: "Network error" }); }
    setShowDeleteSportModal(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!selectedUser) return;
    try {
      const res = await api.admin.revokeUserSession({ params: { id: selectedUser.id, sessionId }, body: {} });
      if (res.status === 200) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setActionMessage({ type: "success", text: "Session revoked" });
      }
    } catch { }
  };

  const handleRevokeAllSessions = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.admin.revokeAllUserSessions({ params: { id: selectedUser.id }, body: {} });
      if (res.status === 200) {
        setSessions([]);
        setActionMessage({ type: "success", text: "All sessions revoked" });
      }
    } catch { }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "24px", verticalAlign: "-4px", marginRight: "8px", color: "var(--primary)" }}>admin_panel_settings</span>
            Admin Panel
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {activeTab === "users" ? `${total} users on the platform` : `${orgTotal} organizations`}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          type="button"
          className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "12px", padding: "6px 14px" }}
          onClick={() => { setActiveTab("users"); setSelectedOrg(null); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "-3px", marginRight: "4px" }}>group</span>
          Users
        </button>
        <button
          type="button"
          className={`btn ${activeTab === "organizations" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "12px", padding: "6px 14px" }}
          onClick={() => { setActiveTab("organizations"); setSelectedUser(null); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "-3px", marginRight: "4px" }}>domain</span>
          Organizations
        </button>
        <button
          type="button"
          className={`btn ${activeTab === "sports" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "12px", padding: "6px 14px" }}
          onClick={() => { setActiveTab("sports"); setSelectedUser(null); setSelectedOrg(null); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "-3px", marginRight: "4px" }}>sports_esports</span>
          Sports Blueprints
        </button>
      </div>

      {activeTab === "users" && (
      <>
      {/* Filters */}
      <div className="glass-card admin-toolbar" style={{ padding: "16px", marginBottom: "16px" }}>
        <label className="dashboard-field admin-toolbar-search">
          <span className="dashboard-field-label">Search</span>
          <div style={{ position: "relative" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "var(--text-muted)" }}>search</span>
            <input
              type="text" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by username or email..."
              className="dashboard-input" style={{ paddingLeft: "32px" }}
            />
          </div>
        </label>
        <div className="dashboard-field admin-filter-field">
          <span className="dashboard-field-label">Role</span>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as UserRole | ""); setPage(1); }}>
            <SelectTrigger style={{ fontSize: "12px" }}>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="dashboard-field admin-filter-field">
          <span className="dashboard-field-label">Status</span>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as UserStatus | ""); setPage(1); }}>
            <SelectTrigger style={{ fontSize: "12px" }}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={`admin-layout${selectedUser ? " admin-layout--split" : ""}`}>
        {/* ── User Table ── */}
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No users found</div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "520px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>User</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Email</th>
                      <th style={{ textAlign: "center", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Role</th>
                      <th style={{ textAlign: "center", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Status</th>
                      <th style={{ textAlign: "center", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}
                        onClick={() => selectUser(u)}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          cursor: "pointer",
                          background: selectedUser?.id === u.id ? "color-mix(in srgb, var(--primary) 8%, transparent)" : undefined,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (selectedUser?.id !== u.id) (e.currentTarget.style.background = "color-mix(in srgb, var(--text-muted) 4%, transparent)"); }}
                        onMouseLeave={e => { if (selectedUser?.id !== u.id) (e.currentTarget.style.background = ""); }}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "50%", overflow: "hidden", backgroundColor: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                              {u.avatar ? <Image src={u.avatar} alt={u.username} width={30} height={30} style={{ objectFit: "cover" }} /> : <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--text-muted)" }}>person</span>}
                              {u.isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-success, #22c55e)", border: "2px solid var(--background)" }} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{u.displayName || u.username}</div>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{u.email}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <RoleBadge role={u.role} />
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <StatusBadge status={u.status} />
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-primary)", fontWeight: "600" }}>{u.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "12px" }}>
                  <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: "11px", padding: "4px 10px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_left</span>
                  </button>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Page {page} of {totalPages}</span>
                  <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ fontSize: "11px", padding: "4px 10px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── User Detail Panel ── */}
        {selectedUser && (
          <div className="glass-card animate-fade-in admin-detail-panel" style={{ padding: "20px", position: "sticky", top: "80px" }}>
            {/* Close */}
            <button type="button" onClick={() => setSelectedUser(null)} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
            </button>

            {/* Profile */}
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 10px", backgroundColor: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selectedUser.avatar ? <Image src={selectedUser.avatar} alt={selectedUser.username} width={56} height={56} style={{ objectFit: "cover" }} /> : <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--text-muted)" }}>person</span>}
              </div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>{selectedUser.displayName || selectedUser.username}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>@{selectedUser.username}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                <RoleBadge role={selectedUser.role} />
                <StatusBadge status={selectedUser.status} />
              </div>
            </div>

            {/* Status message */}
            {actionMessage && (
              <div style={{
                padding: "8px 12px", borderRadius: "6px", marginBottom: "12px", fontSize: "11px",
                background: actionMessage.type === "success" ? "color-mix(in srgb, var(--accent-success, #22c55e) 10%, transparent)" : "color-mix(in srgb, var(--destructive) 10%, transparent)",
                color: actionMessage.type === "success" ? "var(--accent-success, #22c55e)" : "var(--destructive)",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{actionMessage.type === "success" ? "check_circle" : "error"}</span>
                {actionMessage.text}
              </div>
            )}

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              <InfoChip label="Email" value={selectedUser.email} span={2} />
              <InfoChip label="Level" value={String(selectedUser.level)} />
              <InfoChip label="XP" value={String(selectedUser.xp)} />
              <InfoChip label="Elo" value={String(selectedUser.eloRating)} />
              <InfoChip label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 12px", justifyContent: "flex-start" }}
                onClick={() => { setNewRole(selectedUser.role); setShowRoleModal(true); }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>shield_person</span> Change Role
              </button>
              <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 12px", justifyContent: "flex-start" }}
                onClick={() => { setNewStatus(selectedUser.status); setShowStatusModal(true); }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>gavel</span> Change Status
              </button>
              <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 12px", justifyContent: "flex-start" }}
                onClick={handleRevokeAllSessions}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>logout</span> Revoke All Sessions
              </button>
              <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 12px", justifyContent: "flex-start", color: "var(--destructive)", borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)" }}
                onClick={() => setShowDeleteModal(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete_forever</span> Delete User
              </button>
            </div>

            {/* Sessions */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "8px" }}>ACTIVE SESSIONS ({sessions.length})</div>
              {sessionsLoading ? (
                <div style={{ textAlign: "center", padding: "12px" }}><span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span></div>
              ) : sessions.length === 0 ? (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "8px" }}>No active sessions</div>
              ) : (
                sessions.map(s => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                      {s.deviceType === "mobile" ? "phone_iphone" : s.deviceType === "tablet" ? "tablet" : "computer"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", color: "var(--text-primary)" }}>{s.browserName || "Unknown"} · {s.osName || "Unknown"}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.ipAddress || "—"}</div>
                    </div>
                    <button onClick={() => handleRevokeSession(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--destructive)", padding: "2px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      {showRoleModal && <Modal title="Change Role" onClose={() => setShowRoleModal(false)} onConfirm={handleUpdateRole} confirmLabel="Update Role">
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {ROLES.map(r => (
            <button key={r} className={`btn ${newRole === r ? "btn-primary" : "btn-secondary"}`} onClick={() => setNewRole(r)}
              style={{ fontSize: "11px", padding: "6px 14px", textTransform: "capitalize" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{ROLE_META[r].icon}</span> {r}
            </button>
          ))}
        </div>
      </Modal>}

      {showStatusModal && <Modal title="Change Status" onClose={() => setShowStatusModal(false)} onConfirm={handleUpdateStatus} confirmLabel="Update Status" confirmColor={newStatus === "banned" ? "var(--destructive)" : undefined}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {STATUSES.map(s => (
            <button key={s} className={`btn ${newStatus === s ? "btn-primary" : "btn-secondary"}`} onClick={() => setNewStatus(s)}
              style={{ fontSize: "11px", padding: "6px 14px", textTransform: "capitalize", ...(newStatus === s && s === "banned" ? { background: "var(--destructive)" } : {}) }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{STATUS_META[s].icon}</span> {s}
            </button>
          ))}
        </div>
        {(newStatus === "suspended" || newStatus === "banned" || newStatus === "muted") && (
          <label className="dashboard-field">
            <span className="dashboard-field-label">Reason (optional)</span>
            <input type="text" value={statusReason} onChange={e => setStatusReason(e.target.value)} className="dashboard-input" placeholder="Reason for action..." />
          </label>
        )}
      </Modal>}

      {showDeleteModal && <Modal title="Delete User" onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteUser} confirmLabel="Delete Forever" confirmColor="var(--destructive)">
        <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: "0 0 8px" }}>
          Are you sure you want to permanently delete <strong>@{selectedUser?.username}</strong>?
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>This action cannot be undone. All data will be lost.</p>
      </Modal>}
      </>
      )}

      {activeTab === "organizations" && (
      <>
      <div className="glass-card admin-toolbar" style={{ padding: "16px", marginBottom: "16px" }}>
        <label className="dashboard-field admin-toolbar-search">
          <span className="dashboard-field-label">Search</span>
          <div style={{ position: "relative" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "var(--text-muted)" }}>search</span>
            <input
              type="text"
              value={orgSearch}
              onChange={(e) => { setOrgSearch(e.target.value); setOrgPage(1); }}
              placeholder="Search by name or slug..."
              className="dashboard-input"
              style={{ paddingLeft: "32px" }}
            />
          </div>
        </label>
      </div>

      <div className={`admin-layout${selectedOrg ? " admin-layout--split" : ""}`}>
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          {orgsLoading ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
            </div>
          ) : orgs.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No organizations found</div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "480px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Name</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Slug</th>
                      <th style={{ textAlign: "center", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Visibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => { setSelectedOrg(o); setActionMessage(null); }}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          cursor: "pointer",
                          background: selectedOrg?.id === o.id ? "color-mix(in srgb, var(--primary) 8%, transparent)" : undefined,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { if (selectedOrg?.id !== o.id) (e.currentTarget.style.background = "color-mix(in srgb, var(--text-muted) 4%, transparent)"); }}
                        onMouseLeave={(e) => { if (selectedOrg?.id !== o.id) (e.currentTarget.style.background = ""); }}
                      >
                        <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--text-primary)" }}>{o.name}</td>
                        <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{o.slug}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center", textTransform: "capitalize", fontSize: "11px" }}>{o.visibility}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {orgTotalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "12px" }}>
                  <button className="btn btn-secondary" disabled={orgPage <= 1} onClick={() => setOrgPage((p) => p - 1)} style={{ fontSize: "11px", padding: "4px 10px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_left</span>
                  </button>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Page {orgPage} of {orgTotalPages}</span>
                  <button className="btn btn-secondary" disabled={orgPage >= orgTotalPages} onClick={() => setOrgPage((p) => p + 1)} style={{ fontSize: "11px", padding: "4px 10px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedOrg && (
          <div className="glass-card animate-fade-in admin-detail-panel" style={{ padding: "20px", position: "sticky", top: "80px" }}>
            <button type="button" onClick={() => setSelectedOrg(null)} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
            </button>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>{selectedOrg.name}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{selectedOrg.slug}</div>
            </div>
            {actionMessage && activeTab === "organizations" && (
              <div style={{
                padding: "8px 12px", borderRadius: "6px", marginBottom: "12px", fontSize: "11px",
                background: actionMessage.type === "success" ? "color-mix(in srgb, var(--accent-success, #22c55e) 10%, transparent)" : "color-mix(in srgb, var(--destructive) 10%, transparent)",
                color: actionMessage.type === "success" ? "var(--accent-success, #22c55e)" : "var(--destructive)",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{actionMessage.type === "success" ? "check_circle" : "error"}</span>
                {actionMessage.text}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              <InfoChip label="Visibility" value={selectedOrg.visibility} />
              <InfoChip label="Created" value={new Date(selectedOrg.createdAt).toLocaleString()} />
              {selectedOrg.description && <InfoChip label="Description" value={selectedOrg.description} span={2} />}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "11px", padding: "6px 12px", justifyContent: "flex-start", color: "var(--destructive)", borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", width: "100%" }}
              onClick={() => setShowDeleteOrgModal(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete_forever</span>
              Delete organization
            </button>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "10px 0 0" }}>
              Deletes the org row; tournaments and members cascade from the database.
            </p>
          </div>
        )}
      </div>

      {showDeleteOrgModal && (
        <Modal title="Delete organization" onClose={() => setShowDeleteOrgModal(false)} onConfirm={handleDeleteOrg} confirmLabel="Delete forever" confirmColor="var(--destructive)">
          <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: "0 0 8px" }}>
            Permanently delete <strong>{selectedOrg?.name}</strong>?
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            All tournaments under this organization and related lobby/match data will be removed. This cannot be undone.
          </p>
        </Modal>
      )}
      </>
      )}

      {activeTab === "sports" && (
        <>
          <div className="glass-card admin-toolbar" style={{ padding: "16px", marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: "12px", padding: "8px 16px" }}
              onClick={() => {
                setSportForm({
                  name: "",
                  category: "esports",
                  scoringType: "points_high",
                  mode: "1v1",
                  defaultHasDraws: false,
                  defaultMinTeamSize: 1,
                  defaultMaxTeamSize: 1,
                  requiredHandleType: null,
                  tournamentConfigSchema: {},
                  matchConfigSchema: {},
                });
                setShowSportModal(true);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
              Add New Sport
            </button>
          </div>

          <div className={`admin-layout${selectedSport ? " admin-layout--split" : ""}`}>
            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              {sportsLoading ? (
                <div style={{ padding: "48px", textAlign: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
                </div>
              ) : sports.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No Sports defined yet.</div>
              ) : (
                <div className="admin-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "520px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Sport Name</th>
                        <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Category</th>
                        <th style={{ textAlign: "center", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Mode</th>
                        <th style={{ textAlign: "center", padding: "10px 14px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px" }}>Scoring</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sports.map(s => (
                        <tr key={s.id}
                          onClick={() => { setSelectedSport(s); setActionMessage(null); }}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                            cursor: "pointer",
                            background: selectedSport?.id === s.id ? "color-mix(in srgb, var(--primary) 8%, transparent)" : undefined,
                          }}
                        >
                          <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--text-primary)" }}>{s.name}</td>
                          <td style={{ padding: "10px 14px", textTransform: "capitalize" }}>{s.category}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", textTransform: "uppercase" }}>{s.mode}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>{s.scoringType.replace("_", " ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedSport && (
              <div className="glass-card animate-fade-in admin-detail-panel" style={{ padding: "20px", position: "sticky", top: "80px" }}>
                <button type="button" onClick={() => setSelectedSport(null)} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                </button>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>{selectedSport.name}</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Blueprint ID: {selectedSport.id}</p>

                {actionMessage && activeTab === "sports" && (
                  <div style={{ padding: "8px 12px", borderRadius: "6px", marginBottom: "12px", fontSize: "11px", background: "color-mix(in srgb, var(--accent-success, #22c55e) 10%, transparent)", color: "var(--accent-success, #22c55e)" }}>
                    {actionMessage.text}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  <InfoChip label="Category" value={selectedSport.category} />
                  <InfoChip label="Mode" value={selectedSport.mode} />
                  <InfoChip label="Scoring" value={selectedSport.scoringType} />
                  <InfoChip label="Draws" value={selectedSport.defaultHasDraws ? "Allowed" : "No Draws"} />
                  <InfoChip label="Handle Req" value={selectedSport.requiredHandleType || "None"} />
                  <InfoChip label="Team Size" value={`${selectedSport.defaultMinTeamSize} - ${selectedSport.defaultMaxTeamSize}`} />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-secondary" style={{ flex: 1, fontSize: "11px" }} onClick={() => { setSportForm(selectedSport); setShowSportModal(true); }}>
                    Edit Blueprint
                  </button>
                  <button className="btn btn-secondary" style={{ color: "var(--destructive)", borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", fontSize: "11px" }} onClick={() => setShowDeleteSportModal(true)}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {showSportModal && (
            <Modal title={sportForm.id ? "Edit Sport Blueprint" : "Create New Sport"} onClose={() => setShowSportModal(false)} onConfirm={handleSaveSport} confirmLabel="Save Blueprint">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="dashboard-field" style={{ gridColumn: "span 2" }}>
                  <span className="dashboard-field-label">Sport Name</span>
                  <input className="dashboard-input" value={sportForm.name} onChange={e => setSportForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chess, League of Legends" />
                </label>
                
                <label className="dashboard-field">
                  <span className="dashboard-field-label">Category</span>
                  <Select value={sportForm.category} onValueChange={v => setSportForm(f => ({ ...f, category: v as Sport["category"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </label>

                <label className="dashboard-field">
                  <span className="dashboard-field-label">Primary Mode</span>
                  <Select value={sportForm.mode} onValueChange={v => setSportForm(f => ({ ...f, mode: v as Sport["mode"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </label>

                <label className="dashboard-field">
                  <span className="dashboard-field-label">Scoring Engine</span>
                  <Select value={sportForm.scoringType} onValueChange={v => setSportForm(f => ({ ...f, scoringType: v as Sport["scoringType"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SCORING.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </label>

                <label className="dashboard-field">
                  <span className="dashboard-field-label">Required Identity Handle</span>
                  <Select value={sportForm.requiredHandleType || "none"} onValueChange={v => setSportForm(f => ({ ...f, requiredHandleType: v === "none" ? null : v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Required</SelectItem>
                      {HANDLES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>

                <label className="dashboard-field">
                  <span className="dashboard-field-label">Min Team Size</span>
                  <input type="number" className="dashboard-input" value={sportForm.defaultMinTeamSize || 1} onChange={e => setSportForm(f => ({ ...f, defaultMinTeamSize: +e.target.value }))} />
                </label>
                <label className="dashboard-field">
                  <span className="dashboard-field-label">Max Team Size</span>
                  <input type="number" className="dashboard-input" value={sportForm.defaultMaxTeamSize || 1} onChange={e => setSportForm(f => ({ ...f, defaultMaxTeamSize: +e.target.value }))} />
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", gridColumn: "span 2", padding: "8px 0" }}>
                  <input type="checkbox" checked={sportForm.defaultHasDraws} onChange={e => setSportForm(f => ({ ...f, defaultHasDraws: e.target.checked }))} />
                  <span style={{ fontSize: "13px" }}>Allow Draws by Default</span>
                </div>
              </div>
            </Modal>
          )}

          {showDeleteSportModal && (
            <Modal title="Delete Sport Blueprint" onClose={() => setShowDeleteSportModal(false)} onConfirm={handleDeleteSport} confirmLabel="Delete Forever" confirmColor="var(--destructive)">
              <p style={{ fontSize: "13px" }}>Are you sure you want to delete <strong>{selectedSport?.name}</strong>?</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>This will NOT delete existing tournaments, but they may become orphaned or lose some functionality.</p>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

/* ── Utility Components ── */
function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role];
  return (
    <span style={{
      fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px",
      padding: "3px 8px", borderRadius: "4px",
      background: `color-mix(in srgb, ${meta.color} 12%, transparent)`, color: meta.color,
      display: "inline-flex", alignItems: "center", gap: "4px",
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>{meta.icon}</span>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const meta = STATUS_META[status];
  return (
    <span style={{
      fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px",
      padding: "3px 8px", borderRadius: "4px",
      background: `color-mix(in srgb, ${meta.color} 12%, transparent)`, color: meta.color,
      display: "inline-flex", alignItems: "center", gap: "4px",
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>{meta.icon}</span>
      {status}
    </span>
  );
}

function InfoChip({ label, value, span }: { label: string; value: string; span?: number }) {
  return (
    <div style={{ padding: "6px 10px", borderRadius: "6px", background: "color-mix(in srgb, var(--text-muted) 6%, transparent)", gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
      <div style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</div>
      <div style={{ 
        fontSize: "12px", 
        color: "var(--text-primary)", 
        fontWeight: "500", 
        overflow: "hidden", 
        textOverflow: span === 2 ? "initial" : "ellipsis", 
        whiteSpace: span === 2 ? "normal" : "nowrap",
        overflowWrap: "anywhere"
      }}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, onConfirm, confirmLabel, confirmColor, children }: {
  title: string; onClose: () => void; onConfirm: () => void; confirmLabel: string; confirmColor?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="glass-card animate-fade-in modal-dialog" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 16px" }}>{title}</h3>
        {children}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontSize: "11px", padding: "6px 16px" }}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} style={{ fontSize: "11px", padding: "6px 16px", background: confirmColor }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
