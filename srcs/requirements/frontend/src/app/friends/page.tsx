"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/api";

/* ── Types ── */
type FriendshipStatus = "pending" | "accepted" | "blocked";

interface Friend {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string;
  isOnline: boolean;
  status: FriendshipStatus;
  friendshipId: string;
  since: string | Date;
}

const TAB_META: { key: FriendshipStatus | "all"; label: string; icon: string; color: string }[] = [
  { key: "all",      label: "All",     icon: "group",        color: "var(--primary)" },
  { key: "accepted", label: "Friends", icon: "favorite",     color: "var(--accent-success, #22c55e)" },
  { key: "pending",  label: "Pending", icon: "schedule",     color: "var(--accent-warning, #f59e0b)" },
  { key: "blocked",  label: "Blocked", icon: "block",        color: "var(--destructive)" },
];

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FriendshipStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Send request state ── */
  const [showSendModal, setShowSendModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [sendLoading, setSendLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const query = tab !== "all" ? { status: tab } : {};
      const res = await api.friends.getMyFriends({ query });
      if (res.status === 200) setFriends(res.body as Friend[]);
    } catch { }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  /* ── Actions ── */
  const handleAccept = async (friendshipId: string) => {
    try {
      const res = await api.friends.acceptFriendRequest({ params: { friendshipId } });
      if (res.status === 200) {
        setFriends(prev => prev.map(f => f.friendshipId === friendshipId ? { ...f, status: "accepted" as const } : f));
        showMsg("success", "Friend request accepted!");
      } else { showMsg("error", (res.body as any)?.message || "Failed"); }
    } catch { showMsg("error", "Network error"); }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      const res = await api.friends.rejectFriendRequest({ params: { friendshipId } });
      if (res.status === 200) {
        setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
        showMsg("success", "Friend request rejected");
      } else { showMsg("error", (res.body as any)?.message || "Failed"); }
    } catch { showMsg("error", "Network error"); }
  };

  const handleRemove = async (friendshipId: string) => {
    try {
      const res = await api.friends.removeFriend({ params: { friendshipId } });
      if (res.status === 200) {
        setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
        showMsg("success", "Friend removed");
      } else { showMsg("error", (res.body as any)?.message || "Failed"); }
    } catch { showMsg("error", "Network error"); }
  };

  const handleBlock = async (userId: string) => {
    try {
      const res = await api.friends.blockUser({ params: { userId } });
      if (res.status === 200) {
        fetchFriends();
        showMsg("success", "User blocked");
      } else { showMsg("error", (res.body as any)?.message || "Failed"); }
    } catch { showMsg("error", "Network error"); }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const res = await api.friends.unblockUser({ params: { userId } });
      if (res.status === 200) {
        setFriends(prev => prev.filter(f => f.id !== userId));
        showMsg("success", "User unblocked");
      } else { showMsg("error", (res.body as any)?.message || "Failed"); }
    } catch { showMsg("error", "Network error"); }
  };

  const handleSendRequest = async () => {
    if (!targetUserId.trim()) return;
    setSendLoading(true);
    try {
      const res = await api.friends.sendFriendRequest({ body: { targetUserId: targetUserId.trim() } });
      if (res.status === 201) {
        showMsg("success", "Friend request sent!");
        setShowSendModal(false);
        setTargetUserId("");
        fetchFriends();
      } else { showMsg("error", (res.body as any)?.message || "Failed to send request"); }
    } catch { showMsg("error", "Network error"); }
    finally { setSendLoading(false); }
  };

  /* ── Filter ── */
  const filtered = friends.filter(f => {
    if (!search) return true;
    const q = search.toLowerCase();
    return f.username.toLowerCase().includes(q) || (f.displayName || "").toLowerCase().includes(q);
  });

  const counts = {
    all: friends.length,
    accepted: friends.filter(f => f.status === "accepted").length,
    pending: friends.filter(f => f.status === "pending").length,
    blocked: friends.filter(f => f.status === "blocked").length,
  };

  return (
    <div className="friends-page">
      {/* Header */}
      <div className="friends-page-header">
        <div>
          <h1 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "24px", verticalAlign: "-4px", marginRight: "8px", color: "var(--primary)" }}>group</span>
            Friends
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>{counts.accepted} friends · {counts.pending} pending</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowSendModal(true)} style={{ fontSize: "12px", padding: "8px 18px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_add</span>
          Add Friend
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div style={{
          padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "12px",
          background: message.type === "success" ? "color-mix(in srgb, var(--accent-success, #22c55e) 10%, transparent)" : "color-mix(in srgb, var(--destructive) 10%, transparent)",
          color: message.type === "success" ? "var(--accent-success, #22c55e)" : "var(--destructive)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{message.type === "success" ? "check_circle" : "error"}</span>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="friends-tabs">
        {TAB_META.map(t => (
          <button
            key={t.key}
            type="button"
            className={`btn ${tab === t.key ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab(t.key)}
            style={{ fontSize: "11px", padding: "6px 14px", ...(tab === t.key ? { background: t.color } : {}) }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{t.icon}</span>
            {t.label}
            <span style={{
              marginLeft: "4px", fontSize: "10px", padding: "1px 6px", borderRadius: "8px",
              background: tab === t.key ? "rgba(255,255,255,0.2)" : "color-mix(in srgb, var(--text-muted) 10%, transparent)",
            }}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "var(--text-muted)" }}>search</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search friends..." className="dashboard-input" style={{ paddingLeft: "36px", width: "100%" }} />
      </div>

      {/* Friends list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", opacity: 0.3 }}>group</span>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "12px" }}>
            {search ? "No results found" : tab === "pending" ? "No pending requests" : tab === "blocked" ? "No blocked users" : "No friends yet. Send a request!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(friend => (
            <FriendCard
              key={friend.friendshipId}
              friend={friend}
              onAccept={handleAccept}
              onReject={handleReject}
              onRemove={handleRemove}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
            />
          ))}
        </div>
      )}

      {/* ── Send Request Modal ── */}
      {showSendModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowSendModal(false)}>
          <div className="glass-card animate-fade-in modal-dialog" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", verticalAlign: "-3px", marginRight: "6px", color: "var(--primary)" }}>person_add</span>
              Send Friend Request
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 16px" }}>Enter the user ID of the player you want to add.</p>

            <label className="dashboard-field">
              <span className="dashboard-field-label">User ID</span>
              <input
                type="text" value={targetUserId} onChange={e => setTargetUserId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="dashboard-input"
                onKeyDown={e => e.key === "Enter" && !sendLoading && handleSendRequest()}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowSendModal(false)} style={{ fontSize: "11px", padding: "6px 16px" }}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSendRequest} disabled={sendLoading || !targetUserId.trim()} style={{ fontSize: "11px", padding: "6px 16px" }}>
                {sendLoading ? <><span className="material-symbols-outlined" style={{ fontSize: "14px", animation: "spin 1s linear infinite" }}>progress_activity</span> Sending...</> : <><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>send</span> Send Request</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Friend Card ── */
function FriendCard({ friend, onAccept, onReject, onRemove, onBlock, onUnblock }: {
  friend: Friend;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (id: string) => void;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="glass-card friend-card">
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden",
          backgroundColor: "var(--bg-secondary)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {friend.avatar ? (
            <img src={friend.avatar} alt={friend.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--text-muted)" }}>person</span>
          )}
        </div>
        {friend.status !== "blocked" && (
          <div style={{
            position: "absolute", bottom: "1px", right: "1px",
            width: "10px", height: "10px", borderRadius: "50%",
            border: "2px solid var(--background)",
            background: friend.isOnline ? "var(--accent-success, #22c55e)" : "var(--text-muted)",
          }} />
        )}
      </div>

      {/* Info */}
      <div className="friend-card-main">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{friend.displayName || friend.username}</span>
          {friend.status === "pending" && (
            <span style={{
              fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px",
              padding: "2px 6px", borderRadius: "4px",
              background: "color-mix(in srgb, var(--accent-warning, #f59e0b) 15%, transparent)",
              color: "var(--accent-warning, #f59e0b)",
            }}>Pending</span>
          )}
          {friend.status === "blocked" && (
            <span style={{
              fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px",
              padding: "2px 6px", borderRadius: "4px",
              background: "color-mix(in srgb, var(--destructive) 15%, transparent)",
              color: "var(--destructive)",
            }}>Blocked</span>
          )}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          @{friend.username} · {friend.isOnline ? <span style={{ color: "var(--accent-success, #22c55e)" }}>Online</span> : "Offline"}
        </div>
      </div>

      {/* Actions */}
      <div className="friend-card-actions">
        {friend.status === "pending" && (
          <>
            <button type="button" className="btn btn-primary" onClick={() => onAccept(friend.friendshipId)} style={{ fontSize: "11px", padding: "6px 12px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check</span> Accept
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onReject(friend.friendshipId)} style={{ fontSize: "11px", padding: "6px 12px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span> Decline
            </button>
          </>
        )}

        {friend.status === "accepted" && (
          <div className="friend-card-menu-wrap" style={{ position: "relative" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowMenu(!showMenu)} style={{ fontSize: "11px", padding: "6px 10px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>more_vert</span>
            </button>
            {showMenu && (
              <div className="dropdown-menu-panel" style={{
                position: "absolute", right: 0, top: "100%", marginTop: "4px",
                minWidth: "160px", zIndex: 20,
              }}>
                <MenuButton icon="person_remove" label="Remove Friend" onClick={() => { onRemove(friend.friendshipId); setShowMenu(false); }} />
                <MenuButton icon="block" label="Block" destructive onClick={() => { onBlock(friend.id); setShowMenu(false); }} />
              </div>
            )}
          </div>
        )}

        {friend.status === "blocked" && (
          <button type="button" className="btn btn-secondary" onClick={() => onUnblock(friend.id)} style={{ fontSize: "11px", padding: "6px 12px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>lock_open</span> Unblock
          </button>
        )}
      </div>
    </div>
  );
}

function MenuButton({ icon, label, destructive, onClick }: { icon: string; label: string; destructive?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dropdown-menu-item${destructive ? " dropdown-menu-item--destructive" : ""}`}
      style={{ width: "100%" }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{icon}</span>
      {label}
    </button>
  );
}
