"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/hooks";
import api from "@/lib/api/api";
import { toast } from "react-hot-toast";
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

interface OrgInvite {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: string;
  joinedAt: string | Date;
}

const TAB_META: { key: FriendshipStatus | "invites" | "all"; label: string; icon: string; color: string }[] = [
  { key: "all",      label: "All",       icon: "group",        color: "var(--primary)" },
  { key: "accepted", label: "Friends",   icon: "favorite",     color: "var(--accent-success, #22c55e)" },
  { key: "pending",  label: "Requests",  icon: "schedule",     color: "var(--accent-warning, #f59e0b)" },
  { key: "invites",  label: "Org Invites", icon: "business",   color: "var(--accent-info, #3b82f6)" },
  { key: "blocked",  label: "Blocked",   icon: "block",        color: "var(--destructive)" },
];

export default function FriendsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [orgInvites, setOrgInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FriendshipStatus | "invites" | "all">("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── User Search state ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query = (tab !== "all" && tab !== "invites") ? { status: tab } : {};
      const [fRes, oRes] = await Promise.all([
        api.friends.getMyFriends({ query }),
        api.organizations.getMyInvites()
      ]);
      if (fRes.status === 200) setFriends(fRes.body as Friend[]);
      if (oRes.status === 200) setOrgInvites(oRes.body.data as OrgInvite[]);
    } catch { }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  /* ── Friend Actions ── */
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
        fetchData();
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
        fetchData();
      } else {
        showMsg("error", (res.body as any)?.message || "Failed to send request");
      }
    } catch {
      showMsg("error", "Network error");
    } finally {
      setSendingTo(null);
    }
  };

  /* ── Org Actions ── */
  const handleAcceptOrg = async (id: string) => {
    try {
      const res = await api.organizations.acceptInvite({ params: { id } });
      if (res.status === 200) {
        setOrgInvites(prev => prev.filter(inv => inv.organizationId !== id));
        showMsg("success", "Joined organization!");
      }
    } catch { showMsg("error", "Failed to join"); }
  };

  const handleDeclineOrg = async (id: string) => {
    try {
      const res = await api.organizations.declineInvite({ params: { id } });
      if (res.status === 200) {
        setOrgInvites(prev => prev.filter(inv => inv.organizationId !== id));
        showMsg("success", "Invitation declined");
      }
    } catch { showMsg("error", "Failed to decline"); }
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
    invites: orgInvites.length,
  };

  return (
    <div className="friends-page">
      {/* Header */}
      <div className="friends-page-header">
        <div>
          <h1 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "24px", verticalAlign: "-4px", marginRight: "8px", color: "var(--primary)" }}>group</span>
            Friends & Connections
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {counts.accepted} friends · {counts.invites} pending invites
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ fontSize: "12px", padding: "8px 18px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_search</span>
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
            }}>{counts[t.key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      {tab !== "invites" && (
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "var(--text-muted)" }}>search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter friends..." className="dashboard-input" style={{ paddingLeft: "36px", width: "100%" }} />
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
        </div>
      ) : tab === "invites" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {orgInvites.length === 0 ? (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", opacity: 0.3 }}>business</span>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "12px" }}>No organization invitations.</p>
            </div>
          ) : (
            orgInvites.map(inv => (
              <div key={inv.organizationId} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>business</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{inv.organizationName}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Invited as <b>{inv.role}</b></div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                   <button className="btn btn-primary" onClick={() => handleAcceptOrg(inv.organizationId)} style={{ fontSize: "11px", padding: "6px 12px" }}>Accept</button>
                   <button className="btn btn-secondary" onClick={() => handleDeclineOrg(inv.organizationId)} style={{ fontSize: "11px", padding: "6px 12px" }}>Decline</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", opacity: 0.3 }}>group</span>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "12px" }}>
            {search ? "No results found" : tab === "pending" ? "No pending requests" : tab === "blocked" ? "No blocked users" : "No friends yet."}
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

      {/* ── Find Players Modal ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowAddModal(false)}>
          <div className="glass-card modal-dialog" style={{ width: "100%", maxWidth: "480px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>Find Players</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>Search by username to add friends.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "var(--text-muted)" }}>search</span>
              <input type="text" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} placeholder="Type to search..." className="dashboard-input" style={{ paddingLeft: "38px", width: "100%" }} autoFocus />
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {searching ? (
                 <div style={{ textAlign: "center", padding: "20px" }}><span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span></div>
              ) : searchResults.map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {u.avatar ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>person</span>}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{u.displayName || u.username}</div>
                  </div>
                  <button onClick={() => handleSendRequest(u.id)} disabled={sendingTo === u.id} className="btn btn-primary" style={{ padding: "4px 12px", fontSize: "11px" }}>{sendingTo === u.id ? "..." : "Add"}</button>
                </div>
              ))}
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
    <div className="glass-card friend-card" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {friend.avatar ? <img src={friend.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--text-muted)" }}>person</span>}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{friend.displayName || friend.username}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{friend.username}</div>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        {friend.status === "accepted" && <button className="btn btn-primary" onClick={onChat} style={{ fontSize: "11px", padding: "6px 12px" }}>Chat</button>}
        {friend.status === "pending" && !isOutgoing && (
          <>
            <button className="btn btn-primary" onClick={() => onAccept(friend.friendshipId)} style={{ fontSize: "11px", padding: "6px 12px" }}>Accept</button>
            <button className="btn btn-secondary" onClick={() => onReject(friend.friendshipId)} style={{ fontSize: "11px", padding: "6px 12px" }}>Ignore</button>
          </>
        )}
        {friend.status === "pending" && isOutgoing && <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600" }}>REQUESTED</span>}
        <DropdownMenu>
          <DropdownMenuTrigger className="btn btn-secondary" style={{ padding: "6px", minWidth: "32px" }}><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>more_vert</span></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass w-40">
            <DropdownMenuItem onClick={() => onRemove(friend.friendshipId)} className="text-destructive"><span className="material-symbols-outlined mr-2">person_remove</span>Remove</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBlock(friend.id)}><span className="material-symbols-outlined mr-2">block</span>Block</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
