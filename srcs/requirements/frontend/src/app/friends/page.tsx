"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/hooks";
import api from "@/lib/api/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  senderId: string;
  since: string | Date;
}

interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  isOnline: boolean;
  level: number;
}

const TAB_META: { key: FriendshipStatus | "all"; label: string; icon: string; color: string }[] = [
  { key: "all",      label: "All",     icon: "group",        color: "var(--primary)" },
  { key: "accepted", label: "Friends", icon: "favorite",     color: "var(--accent-success, #22c55e)" },
  { key: "pending",  label: "Pending", icon: "schedule",     color: "var(--accent-warning, #f59e0b)" },
  { key: "blocked",  label: "Blocked", icon: "block",        color: "var(--destructive)" },
];

export default function FriendsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FriendshipStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── User Search state ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ── User Search Logic ── */
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.users.searchUsers({ query: { q: userSearchQuery.trim(), limit: 10 } });
        if (res.status === 200 && Array.isArray(res.body)) {
          setSearchResults(res.body as PublicUser[]);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [userSearchQuery]);

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

  const handleSendRequest = async (targetId: string) => {
    setSendingTo(targetId);
    try {
      const res = await api.friends.sendFriendRequest({ body: { targetUserId: targetId } });
      if (res.status === 201) {
        showMsg("success", "Friend request sent!");
        fetchFriends();
      } else {
        showMsg("error", (res.body as any)?.message || "Failed to send request");
      }
    } catch {
      showMsg("error", "Network error");
    } finally {
      setSendingTo(null);
    }
  };

  const openDMChat = (friendUsername: string) => {
    const myUsername = user?.username ?? "";
    const sorted = [myUsername, friendUsername].sort((a, b) => a.localeCompare(b));
    const roomSlug = `dm-${sorted[0]}-${sorted[1]}`;
    router.push(`/chat?room=${encodeURIComponent(roomSlug)}`);
  };

  /* ── Filter ── */
  const filtered = friends.filter(f => {
    if (!search) return true;
    const q = search.toLowerCase();
    return f.username.toLowerCase().includes(q) || (f.displayName || "").toLowerCase().includes(q);
  });

  const getFriendshipStatus = (userId: string) => {
    return friends.find(f => f.id === userId)?.status ?? null;
  };

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
        <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ fontSize: "12px", padding: "8px 18px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_add</span>
          Find Players
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

      {/* Search Current Friends */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "var(--text-muted)" }}>search</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter friends..." className="dashboard-input" style={{ paddingLeft: "36px", width: "100%" }} />
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
            {search ? "No results found" : tab === "pending" ? "No pending requests" : tab === "blocked" ? "No blocked users" : "No friends yet. Find someone to add!"}
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
              onChat={() => openDMChat(friend.username)}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* ── Find Players Modal (Search) ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowAddModal(false)}>
          <div className="glass-card animate-fade-in modal-dialog" style={{ width: "100%", maxWidth: "480px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", verticalAlign: "-3px", marginRight: "6px", color: "var(--primary)" }}>person_search</span>
                  Find Players
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Search for users by their username or display name.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div style={{ position: "relative", marginBottom: "16px" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "var(--text-muted)" }}>search</span>
              <input
                type="text" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)}
                placeholder="Type to search..."
                className="dashboard-input"
                style={{ paddingLeft: "38px", width: "100%" }}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {searching && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
                </div>
              )}

              {!searching && userSearchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "12px" }}>No players found matching "{userSearchQuery}"</div>
              )}

              {searchResults.map(u => {
                const status = getFriendshipStatus(u.id);
                return (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {u.avatar ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>person</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{u.displayName || u.username}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>@{u.username} • Lv.{u.level}</div>
                      </div>
                    </div>

                    {status === "accepted" ? (
                      <span style={{ fontSize: "10px", color: "var(--accent-success)", fontWeight: "600", padding: "4px 8px" }}>FRIENDS</span>
                    ) : status === "pending" ? (
                      <span style={{ fontSize: "10px", color: "var(--accent-warning)", fontWeight: "600", padding: "4px 8px" }}>PENDING</span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(u.id)}
                        disabled={sendingTo === u.id}
                        className="btn btn-primary"
                        style={{ padding: "4px 12px", fontSize: "11px" }}
                      >
                        {sendingTo === u.id ? "..." : "Add"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Friend Card ── */
function FriendCard({ friend, onAccept, onReject, onRemove, onBlock, onUnblock, onChat, currentUserId }: {
  friend: Friend;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (id: string) => void;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onChat: () => void;
  currentUserId?: string;
}) {
  const isOutgoing = friend.status === "pending" && friend.senderId === currentUserId;

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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {friend.displayName || friend.username}
          </span>
          {friend.isOnline && friend.status === "accepted" && <span style={{ fontSize: "10px", color: "var(--accent-success, #22c55e)", fontWeight: "500" }}>• Online</span>}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>@{friend.username}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>Joined {new Date(friend.since).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {friend.status === "accepted" && (
          <>
            <button
              onClick={onChat}
              className="btn btn-primary"
              style={{ padding: "6px 12px", fontSize: "11px", gap: "4px" }}
              title="Message"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chat</span>
              Chat
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="btn btn-secondary" style={{ padding: "6px", minWidth: "32px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>more_vert</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass w-40">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onRemove(friend.friendshipId)} className="text-destructive focus:text-destructive">
                    <span className="material-symbols-outlined mr-2">person_remove</span>
                    Remove Friend
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBlock(friend.id)}>
                    <span className="material-symbols-outlined mr-2">block</span>
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {friend.status === "pending" && (
          <div style={{ display: "flex", gap: "4px" }}>
            {isOutgoing ? (
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", padding: "6px 12px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                  REQUESTED
                </span>
                <button
                  onClick={() => onRemove(friend.friendshipId)}
                  className="btn btn-ghost"
                  style={{ padding: "6px 4px", color: "var(--destructive)", minWidth: "auto" }}
                  title="Cancel Request"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>cancel</span>
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => onAccept(friend.friendshipId)} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "11px" }}>Accept</button>
                <button onClick={() => onReject(friend.friendshipId)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "11px" }}>Ignore</button>
              </>
            )}
          </div>
        )}

        {friend.status === "blocked" && (
          <button onClick={() => onUnblock(friend.id)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "11px" }}>Unblock</button>
        )}
      </div>
    </div>
  );
}
