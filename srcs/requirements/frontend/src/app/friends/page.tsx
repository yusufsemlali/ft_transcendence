"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api/api";
import type { Friend, PublicUser } from "@ft-transcendence/contracts";
import { toast } from "@/components/ui/sonner";

type Tab = "all" | "online" | "pending" | "blocked";

export default function FriendsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  /* ── User Search State ── */
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFriends = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.friends.getMyFriends({ query: {} });
      if (response.status === 200 && Array.isArray(response.body)) {
        setFriends(response.body);
      }
    } catch {
      toast.error("Failed to load friends list");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  /* ── User Search with debounce ── */
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.users.searchUsers({ query: { q: userSearchQuery.trim(), limit: 20 } });
        if (res.status === 200 && Array.isArray(res.body)) {
          setSearchResults(res.body);
        }
      } catch {
        /* silently fail */
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [userSearchQuery]);

  /* ── Actions ── */
  const handleSendRequest = async (targetUserId: string) => {
    setSendingTo(targetUserId);
    try {
      const res = await api.friends.sendFriendRequest({ body: { targetUserId } });
      if (res.status === 201) {
        toast.success("Friend request sent!");
        loadFriends();
      } else {
        const msg = (res.body as any)?.message || "Could not send request";
        toast.error(msg);
      }
    } catch {
      toast.error("Failed to send friend request");
    } finally {
      setSendingTo(null);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      const res = await api.friends.acceptFriendRequest({ params: { friendshipId } });
      if (res.status === 200) {
        toast.success("Friend request accepted");
        loadFriends();
      }
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      const res = await api.friends.rejectFriendRequest({ params: { friendshipId } });
      if (res.status === 200) {
        toast.success("Friend request rejected");
        loadFriends();
      }
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleRemove = async (friendshipId: string) => {
    try {
      const res = await api.friends.removeFriend({ params: { friendshipId } });
      if (res.status === 200) {
        toast.success("Friend removed");
        loadFriends();
      }
    } catch {
      toast.error("Failed to remove friend");
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const res = await api.friends.unblockUser({ params: { userId } });
      if (res.status === 200) {
        toast.success("User unblocked");
        loadFriends();
      }
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  const openDMChat = (friendUsername: string) => {
    const myUsername = user?.username ?? "";
    const sorted = [myUsername, friendUsername].sort((a, b) => a.localeCompare(b));
    const roomSlug = `dm-${sorted[0]}-${sorted[1]}`;
    router.push(`/chat?room=${encodeURIComponent(roomSlug)}`);
  };

  /* ── Helpers ── */
  const friendIds = new Set(friends.map((f) => f.id));

  const getFriendshipStatus = (userId: string) => {
    const f = friends.find((fr) => fr.id === userId);
    return f?.status ?? null;
  };

  /* ── Filtering ── */
  const filtered = friends.filter((f) => {
    const username = (f.username ?? "").toLowerCase();
    const displayName = (f.displayName ?? "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = username.includes(query) || displayName.includes(query);

    switch (tab) {
      case "online":
        return f.status === "accepted" && f.isOnline && matchesSearch;
      case "pending":
        return f.status === "pending" && matchesSearch;
      case "blocked":
        return f.status === "blocked" && matchesSearch;
      default:
        return f.status === "accepted" && matchesSearch;
    }
  });

  const counts = {
    all: friends.filter((f) => f.status === "accepted").length,
    online: friends.filter((f) => f.status === "accepted" && f.isOnline).length,
    pending: friends.filter((f) => f.status === "pending").length,
    blocked: friends.filter((f) => f.status === "blocked").length,
  };

  /* ── Auth gate ── */
  if (!isAuthenticated) {
    return (
      <div className="page" style={{ maxWidth: 600, textAlign: "center", paddingTop: 80 }}>
        <div className="glass-card" style={{ padding: "48px 32px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--primary)", marginBottom: 16 }}>group</span>
          <h2 style={{ fontSize: 24, fontWeight: 300, marginBottom: 12 }}>Friends</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
            Sign in to manage your friends.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ borderRadius: 20 }}>Sign in</Link>
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 300, margin: 0 }}>Friends</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="glass" style={{ padding: "6px 14px", borderRadius: 20, display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border-color)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text-muted)" }}>group</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              {counts.all} friends&nbsp;·&nbsp;{counts.online} online
            </span>
          </div>
          <button
            onClick={() => setShowAddPanel(!showAddPanel)}
            className={showAddPanel ? "btn btn-primary" : "btn btn-secondary"}
            style={{ borderRadius: 20, padding: "6px 16px", fontSize: 12, gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {showAddPanel ? "close" : "person_add"}
            </span>
            {showAddPanel ? "Close" : "Add Friend"}
          </button>
        </div>
      </header>

      {/* ── Add Friend Panel ── */}
      {showAddPanel && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>person_search</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Find Players</span>
          </div>

          {/* Search input */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 18, color: "var(--text-muted)", pointerEvents: "none",
            }}>search</span>
            <input
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search by username or display name…"
              className="input"
              style={{ paddingLeft: 38 }}
              autoFocus
            />
          </div>

          {/* Results */}
          {searching && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0", textAlign: "center" }}>Searching…</div>
          )}

          {!searching && userSearchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0", textAlign: "center" }}>
              No users found matching "{userSearchQuery}"
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="stack-xs">
              {searchResults.map((u) => {
                const status = getFriendshipStatus(u.id);
                const isFriend = status === "accepted";
                const isPending = status === "pending";

                return (
                  <div
                    key={u.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: "var(--radius)",
                      background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: u.avatar ? `url(${u.avatar}) center/cover no-repeat` : "var(--bg-secondary)",
                          border: "2px solid var(--border-color)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {!u.avatar && <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text-muted)" }}>person</span>}
                        </div>
                        <span style={{
                          position: "absolute", bottom: -1, right: -1,
                          width: 10, height: 10, borderRadius: "50%",
                          background: u.isOnline ? "#34d399" : "var(--text-muted)",
                          border: "2px solid var(--background)",
                        }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.displayName || u.username}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          @{u.username}
                          {u.level > 0 && <> · Lv.{u.level}</>}
                        </div>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isFriend ? (
                        <span className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius)", cursor: "default", opacity: 0.6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                          Friends
                        </span>
                      ) : isPending ? (
                        <span className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius)", cursor: "default", opacity: 0.6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                          Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(u.id)}
                          disabled={sendingTo === u.id}
                          className="btn btn-primary"
                          style={{
                            padding: "4px 12px", fontSize: 11, borderRadius: "var(--radius)", gap: 4,
                            opacity: sendingTo === u.id ? 0.5 : 1,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span>
                          {sendingTo === u.id ? "Sending…" : "Add"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {(["all", "online", "pending", "blocked"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={t === tab ? "button-group-item active" : "button-group-item"}
            style={{ borderRadius: "var(--radius)", border: "none", padding: "6px 14px" }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {counts[t] > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                background: t === tab ? "rgba(255,255,255,0.2)" : "var(--bg-secondary)",
                color: t === tab ? "white" : "var(--text-muted)",
              }}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends search */}
      <div style={{ marginBottom: 24, position: "relative" }}>
        <span className="material-symbols-outlined" style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: 18, color: "var(--text-muted)", pointerEvents: "none",
        }}>search</span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter friends…"
          className="input"
          style={{ paddingLeft: 38, maxWidth: 400 }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>Loading friends…</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--text-muted)", opacity: 0.4, display: "block", marginBottom: 8 }}>
            {tab === "pending" ? "mail" : tab === "blocked" ? "block" : "group_off"}
          </span>
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
            {tab === "pending"
              ? "No pending friend requests"
              : tab === "blocked"
              ? "No blocked users"
              : searchQuery
              ? "No friends match your search"
              : "Your friends list is empty"}
          </div>
          {tab === "all" && !searchQuery && (
            <button
              onClick={() => setShowAddPanel(true)}
              className="btn btn-primary"
              style={{ borderRadius: 20, fontSize: 12, gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
              Find players to add
            </button>
          )}
        </div>
      ) : (
        <div className="stack-xs">
          {filtered.map((friend) => (
            <div
              key={friend.friendshipId}
              className="glass-card"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", gap: 16, flexWrap: "wrap",
              }}
            >
              {/* Left: Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 180 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: friend.avatar ? `url(${friend.avatar}) center/cover no-repeat` : "var(--bg-secondary)",
                    border: "2px solid var(--border-color)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {!friend.avatar && <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--text-muted)" }}>person</span>}
                  </div>
                  {friend.status === "accepted" && (
                    <span style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: "50%",
                      background: friend.isOnline ? "#34d399" : "var(--text-muted)",
                      border: "2px solid var(--background)",
                    }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{friend.displayName || friend.username}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    @{friend.username}
                    {friend.status === "accepted" && (
                      <> · <span style={{ color: friend.isOnline ? "#34d399" : "var(--text-muted)" }}>{friend.isOnline ? "Online" : "Offline"}</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                {friend.status === "accepted" && (
                  <>
                    <button
                      onClick={() => openDMChat(friend.username)}
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius)", gap: 4 }}
                      title={`Chat with ${friend.displayName || friend.username}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chat</span>
                      Chat
                    </button>
                    <Link
                      href={`/profile/${friend.username}`}
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius)", gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                      Profile
                    </Link>
                    <button
                      onClick={() => handleRemove(friend.friendshipId)}
                      className="btn btn-ghost"
                      style={{ padding: "6px 8px", color: "var(--text-muted)" }}
                      title="Remove friend"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_remove</span>
                    </button>
                  </>
                )}
                {friend.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAccept(friend.friendshipId)}
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius)", gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(friend.friendshipId)}
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius)", gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      Reject
                    </button>
                  </>
                )}
                {friend.status === "blocked" && (
                  <button
                    onClick={() => handleUnblock(friend.id)}
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius)", gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>block</span>
                    Unblock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
