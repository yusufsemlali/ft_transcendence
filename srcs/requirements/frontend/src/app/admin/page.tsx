"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/api";

/* ── Types (from contracts) ── */
type UserRole = "user" | "admin" | "moderator" | "organizer";
type UserStatus = "active" | "suspended" | "banned" | "muted";

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  displayName: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  eloRating: number;
  isOnline: boolean;
  createdAt: string | Date;
}

interface Session {
  id: string;
  browserName: string | null;
  osName: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  createdAt: string | Date;
  expiresAt: string | Date | null;
}

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
      const query: any = { page, pageSize: 20 };
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
      } else { setActionMessage({ type: "error", text: (res.body as any)?.message || "Failed" }); }
    } catch { setActionMessage({ type: "error", text: "Network error" }); }
    setShowRoleModal(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    try {
      const body: any = { status: newStatus };
      if (statusReason) body.reason = statusReason;
      const res = await api.admin.updateUserStatus({ params: { id: selectedUser.id }, body });
      if (res.status === 200) {
        setSelectedUser({ ...selectedUser, status: newStatus });
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u));
        setActionMessage({ type: "success", text: `Status updated to ${newStatus}` });
      } else { setActionMessage({ type: "error", text: (res.body as any)?.message || "Failed" }); }
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
      } else { setActionMessage({ type: "error", text: (res.body as any)?.message || "Failed" }); }
    } catch { setActionMessage({ type: "error", text: "Network error" }); }
    setShowDeleteModal(false);
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
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>{total} users on the platform</p>
        </div>
      </div>

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
        <label className="dashboard-field admin-filter-field">
          <span className="dashboard-field-label">Role</span>
          <select className="dashboard-input" value={roleFilter} onChange={e => { setRoleFilter(e.target.value as any); setPage(1); }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="dashboard-field admin-filter-field">
          <span className="dashboard-field-label">Status</span>
          <select className="dashboard-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
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
                              {u.avatar ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--text-muted)" }}>person</span>}
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
                {selectedUser.avatar ? <img src={selectedUser.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--text-muted)" }}>person</span>}
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
    <div style={{ padding: "6px 10px", borderRadius: "6px", background: "color-mix(in srgb, var(--text-muted) 6%, transparent)", gridColumn: span ? `span ${span}` : undefined }}>
      <div style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
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
