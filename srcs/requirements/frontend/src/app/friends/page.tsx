"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api/api";
import { Friend, User } from "@ft-transcendence/contracts";

import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | "accepted" | "pending" | "blocked";

/* ──────────────────────── Friend Row ──────────────────────── */
function FriendRow({
  friend,
  onAccept,
  onReject,
  onRemove,
  onBlock,
  onUnblock,
}: {
  friend: Friend;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (id: string) => void;
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-b border-border/10 hover:bg-muted/30 transition-all group last:border-0">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-sm bg-muted overflow-hidden ring-1 ring-border/50">
          <img
            src={friend.avatar || "/default-avatar.png"}
            alt={friend.username}
            className="w-full h-full object-cover"
          />
        </div>
        {friend.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background shadow-[0_0_8px_#4ade80]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground text-sm truncate">
            {friend.displayName || friend.username}
          </span>
          {friend.displayName && (
            <span className="text-[10px] font-mono text-muted-foreground/60 truncate">
              @{friend.username}
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mt-0.5">
          {friend.isOnline ? "online" : "offline"} · since{" "}
          {new Date(friend.since).toLocaleDateString()}
        </div>
      </div>

      <Badge
        variant={
          friend.status === "accepted"
            ? "success"
            : friend.status === "pending"
            ? "outline"
            : "destructive"
        }
      >
        {friend.status}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {friend.status === "pending" && (
          <>
            <button
              onClick={() => onAccept(friend.friendshipId)}
              className="p-1.5 rounded-sm hover:bg-green-500/20 text-green-400 transition-colors"
              title="Accept"
            >
              <span className="material-symbols-outlined text-base">check</span>
            </button>
            <button
              onClick={() => onReject(friend.friendshipId)}
              className="p-1.5 rounded-sm hover:bg-destructive/20 text-destructive transition-colors"
              title="Reject"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </>
        )}
        {friend.status === "accepted" && (
          <>
            <button
              onClick={() => onRemove(friend.friendshipId)}
              className="p-1.5 rounded-sm hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove friend"
            >
              <span className="material-symbols-outlined text-base">person_remove</span>
            </button>
            <button
              onClick={() => onBlock(friend.id)}
              className="p-1.5 rounded-sm hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              title="Block user"
            >
              <span className="material-symbols-outlined text-base">block</span>
            </button>
          </>
        )}
        {friend.status === "blocked" && (
          <button
            onClick={() => onUnblock(friend.id)}
            className="p-1.5 rounded-sm hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
            title="Unblock user"
          >
            <span className="material-symbols-outlined text-base">lock_open</span>
          </button>
        )}
      </div>
    </div>
  );
}

function FriendRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-b border-border/10 last:border-0">
      <Skeleton className="w-10 h-10 rounded-sm flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-5 w-16 rounded-sm" />
    </div>
  );
}

/* ──────────────────── Search Result Row ───────────────────── */
function SearchResultRow({
  user,
  onSendRequest,
  sending,
}: {
  user: User;
  onSendRequest: (userId: string) => void;
  sending: string | null;
}) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 hover:bg-muted/30 transition-all rounded-sm">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-sm bg-muted overflow-hidden ring-1 ring-border/50">
          <img
            src={user.avatar || "/default-avatar.png"}
            alt={user.username}
            className="w-full h-full object-cover"
          />
        </div>
        {user.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background shadow-[0_0_6px_#4ade80]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="font-bold text-foreground text-sm truncate block">
          {user.displayName || user.username}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/60">
          @{user.username} · LVL {user.level}
        </span>
      </div>

      <button
        onClick={() => onSendRequest(user.id)}
        disabled={sending === user.id}
        className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-primary text-primary-foreground hover:bg-primary/80 transition-all disabled:opacity-50"
      >
        {sending === user.id ? "sending..." : "add friend"}
      </button>
    </div>
  );
}

/* ──────────────────────── Main Page ───────────────────────── */
export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadFriends = async () => {
    try {
      const res = await api.friends.getMyFriends({ query: {} });
      if (res.status === 200) {
        setFriends(res.body);
      }
      if (res.status === 401) {
        toast.error("Session expired, please login again");
      }
    } catch (err) {
      console.log("Load friends error:", err);
      toast.error("Failed to load friends list");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Search ─── */
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (value.trim().length === 0) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    setShowSearch(true);
    setSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.users.searchUsers({ query: { q: value.trim(), limit: 10 } });
        if (res.status === 200) {
          setSearchResults(res.body);
        }
      } catch {
        /* ignore search errors */
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  /* ─── Actions ─── */
  const handleSendRequest = async (targetUserId: string) => {
    setSendingTo(targetUserId);
    try {
      const res = await api.friends.sendFriendRequest({
        body: { targetUserId },
      });
      if (res.status === 201) {
        toast.success("Friend request sent!");
        setSearchQuery("");
        setShowSearch(false);
        loadFriends();
      } else {
        const errBody = res.body as { message: string };
        toast.error(errBody.message);
      }
    } catch {
      toast.error("Failed to send friend request");
    } finally {
      setSendingTo(null);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      const res = await api.friends.acceptFriendRequest({
        params: { friendshipId },
      });
      if (res.status === 200) {
        toast.success("Friend request accepted!");
        loadFriends();
      } else {
        const errBody = res.body as { message: string };
        toast.error(errBody.message);
      }
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      const res = await api.friends.rejectFriendRequest({
        params: { friendshipId },
      });
      if (res.status === 200) {
        toast.success("Friend request rejected");
        loadFriends();
      } else {
        const errBody = res.body as { message: string };
        toast.error(errBody.message);
      }
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleRemove = async (friendshipId: string) => {
    if (!confirm("Remove this friend?")) return;
    try {
      const res = await api.friends.removeFriend({
        params: { friendshipId },
      });
      if (res.status === 200) {
        toast.success("Friend removed");
        loadFriends();
      } else {
        const errBody = res.body as { message: string };
        toast.error(errBody.message);
      }
    } catch {
      toast.error("Failed to remove friend");
    }
  };

  const handleBlock = async (userId: string) => {
    if (!confirm("Block this user?")) return;
    try {
      const res = await api.friends.blockUser({
        params: { userId },
      });
      if (res.status === 200) {
        toast.success("User blocked");
        loadFriends();
      } else {
        const errBody = res.body as { message: string };
        toast.error(errBody.message);
      }
    } catch {
      toast.error("Failed to block user");
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const res = await api.friends.unblockUser({
        params: { userId },
      });
      if (res.status === 200) {
        toast.success("User unblocked");
        loadFriends();
      } else {
        const errBody = res.body as { message: string };
        toast.error(errBody.message);
      }
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  /* ─── Derived ─── */
  const filtered =
    filter === "all" ? friends : friends.filter((f) => f.status === filter);

  const acceptedCount = friends.filter((f) => f.status === "accepted").length;
  const pendingCount = friends.filter((f) => f.status === "pending").length;
  const blockedCount = friends.filter((f) => f.status === "blocked").length;
  const onlineCount = friends.filter(
    (f) => f.status === "accepted" && f.isOnline
  ).length;

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: friends.length },
    { key: "accepted", label: "Friends", count: acceptedCount },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "blocked", label: "Blocked", count: blockedCount },
  ];

  return (
    <Page>
      <Stack gap="xl">
        {/* ─── Stats ─── */}
        <Section title="social network" icon="group">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Friends", value: acceptedCount, color: "text-foreground" },
              { label: "Online", value: onlineCount, color: "text-green-400" },
              { label: "Pending", value: pendingCount, color: "text-foreground" },
              { label: "Blocked", value: blockedCount, color: "text-muted-foreground/50" },
            ].map((stat) => (
              <Card
                key={stat.label}
                size="sm"
                className="flex flex-col items-center text-center group hover:border-primary/30"
              >
                <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
                  {stat.label}
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-12 my-1" />
                ) : (
                  <div
                    className={`text-3xl font-black font-mono tracking-tighter ${stat.color}`}
                  >
                    {stat.value}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Section>

        {/* ─── Search & Add ─── */}
        <Section title="add friend" icon="person_add">
          <div ref={searchContainerRef} className="relative">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowSearch(true);
                }}
                placeholder="Search users by username or display name..."
                className="input h-12 pl-11 pr-4 w-full border border-border/50 focus:border-primary/50 text-sm font-mono"
              />
            </div>

            {showSearch && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto p-2">
                {searching ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <span className="material-symbols-outlined animate-spin text-muted-foreground text-base">
                      progress_activity
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      searching...
                    </span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-40">
                    <span className="material-symbols-outlined text-3xl">
                      person_search
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest">
                      No users found
                    </span>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <SearchResultRow
                      key={user.id}
                      user={user}
                      onSendRequest={handleSendRequest}
                      sending={sendingTo}
                    />
                  ))
                )}
              </Card>
            )}
          </div>
        </Section>

        {/* ─── Friends List ─── */}
        <Section title="connections" icon="people">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-1 px-6 pt-4 pb-2 border-b border-border/10">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 opacity-60">{f.count}</span>
                </button>
              ))}
            </div>

            <CardContent className="p-0">
              <div className="flex flex-col min-h-[300px]">
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => <FriendRowSkeleton key={i} />)
                ) : filtered.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 opacity-30 grayscale">
                    <span className="material-symbols-outlined text-6xl">
                      {filter === "all"
                        ? "group_off"
                        : filter === "pending"
                        ? "hourglass_empty"
                        : filter === "blocked"
                        ? "block"
                        : "person_off"}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-[0.4em]">
                      {filter === "all"
                        ? "No connections found. Start building your network."
                        : filter === "pending"
                        ? "No pending requests at this time."
                        : filter === "blocked"
                        ? "No blocked users."
                        : "No friends found in this category."}
                    </span>
                  </div>
                ) : (
                  filtered.map((friend) => (
                    <FriendRow
                      key={friend.friendshipId}
                      friend={friend}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onRemove={handleRemove}
                      onBlock={handleBlock}
                      onUnblock={handleUnblock}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </Section>
      </Stack>
    </Page>
  );
}
