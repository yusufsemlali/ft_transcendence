"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/store/hooks";
import { useChatStore } from "@/hooks/use-chat-store";
import api from "@/lib/api/api";
import { toast } from "@/components/ui/sonner";

function formatMessageTime(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ChatShellProps {
  initialRoom?: string;
}

export function ChatShell({ initialRoom }: ChatShellProps) {
  const { user, isAuthenticated } = useAuth();
  const [pendingRoom, setPendingRoom] = useState("");
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const chatUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      username: user.displayName || user.username,
      email: user.email,
    };
  }, [user]);

  const store = useChatStore(chatUser, initialRoom);

  const handleAddFriend = useCallback(async (targetUserId: string) => {
    setAddingFriendId(targetUserId);
    try {
      const res = await api.friends.sendFriendRequest({ body: { targetUserId } });
      if (res.status === 201) {
        toast.success("Friend request sent!");
      } else {
        const msg = (res.body as { message?: string })?.message || "Could not send request";
        toast.error(msg);
      }
    } catch {
      toast.error("Failed to send friend request");
    } finally {
      setAddingFriendId(null);
    }
  }, []);

  useEffect(() => {
    composerRef.current?.focus();
  }, [store.activeRoom]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const distFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    if (distFromBottom < 120) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      setShowJumpToLatest(false);
    } else {
      setShowJumpToLatest(true);
    }
  }, [store.messages, store.activeRoom]);

  const typingLine =
    store.typingUsers.length > 0
      ? `${store.typingUsers.join(", ")} typing…`
      : null;

  /* ─── Auth gates ─── */
  if (!isAuthenticated || !user) {
    return (
      <div className="page" style={{ maxWidth: 600, textAlign: "center", paddingTop: 80 }}>
        <div className="glass-card" style={{ padding: "48px 32px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--primary)", marginBottom: 16 }}>chat</span>
          <h2 style={{ fontSize: 24, fontWeight: 300, marginBottom: 12 }}>Team Chat</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
            Sign in to join rooms, see presence, and send messages in real time.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ borderRadius: 20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (store.availability === "session_expired") {
    return (
      <div className="page" style={{ maxWidth: 600, textAlign: "center", paddingTop: 80 }}>
        <div className="glass-card" style={{ padding: "48px 32px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--destructive-foreground)", marginBottom: 16 }}>lock</span>
          <h2 style={{ fontSize: 24, fontWeight: 300, marginBottom: 12 }}>Session Expired</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
            Your session is no longer valid. Sign in again to reconnect.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login?callbackUrl=%2Fchat" className="btn btn-primary" style={{ borderRadius: 20 }}>Sign in again</Link>
            <button type="button" onClick={store.retryConnection} className="btn btn-secondary" style={{ borderRadius: 20 }}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (store.availability === "unavailable") {
    return (
      <div className="page" style={{ maxWidth: 600, textAlign: "center", paddingTop: 80 }}>
        <div className="glass-card" style={{ padding: "48px 32px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--text-muted)", marginBottom: 16 }}>cloud_off</span>
          <h2 style={{ fontSize: 24, fontWeight: 300, marginBottom: 12 }}>Chat Unavailable</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
            The live connection could not be established right now.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={store.retryConnection} className="btn btn-primary" style={{ borderRadius: 20 }}>Retry connection</button>
            <Link href="/" className="btn btn-secondary" style={{ borderRadius: 20 }}>Back home</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main chat layout ─── */
  return (
    <div className="page" style={{ maxWidth: 1400 }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 300, margin: 0 }}>Chat</h1>
        <div className="glass" style={{ padding: "6px 14px", borderRadius: 20, display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border-color)" }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: store.connectionStatus === "connected" ? "#34d399" : store.connectionStatus === "connecting" ? "#fbbf24" : "#ef4444",
          }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>
            {store.connectionStatus}
          </span>
          {store.connectionStatus === "error" && (
            <button onClick={store.retryConnection} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 10, marginLeft: 4 }}>retry</button>
          )}
        </div>
      </header>

      {/* Connection banner */}
      {store.connectionStatus !== "connected" && store.connectionStatus !== "idle" && (
        <div className="glass" style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 20, fontSize: 12, color: "var(--text-muted)" }}>
          {store.connectionStatus === "connecting"
            ? "Connecting to the room. Live updates will appear in a moment."
            : "Chat is not fully connected. You can browse history while reconnecting."}
        </div>
      )}

      {/* Grid layout */}
      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0, 1fr) 220px", gap: 16, height: "70vh", minHeight: 0 }}>

        {/* ── Left sidebar — Rooms ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Room list */}
          <div className="glass-card" style={{ padding: 16, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1.5px", marginBottom: 12, textTransform: "uppercase" }}>
              Rooms
            </div>
            <div className="stack-xs" style={{ marginBottom: 16 }}>
              {store.rooms.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "16px 0", textAlign: "center" }}>
                  No active rooms yet
                </div>
              ) : (
                store.rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => void store.selectRoom(room.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "8px 12px", borderRadius: "var(--radius)",
                      border: "none", cursor: "pointer", textAlign: "left",
                      fontSize: 13, fontWeight: room.id === store.activeRoom ? 600 : 400,
                      background: room.id === store.activeRoom ? "var(--bg-secondary)" : "transparent",
                      color: room.id === store.activeRoom ? "var(--text-primary)" : "var(--text-secondary)",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--text-muted)", fontSize: 14 }}>#</span>
                      {room.name}
                    </span>
                    {room.id === store.activeRoom && (
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%", background: "#34d399",
                      }} />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Quick room join */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pendingRoom.trim()) return;
                void store.selectRoom(pendingRoom.trim().toLowerCase());
                setPendingRoom("");
              }}
              style={{ display: "flex", gap: 6 }}
            >
              <input
                value={pendingRoom}
                onChange={(e) => setPendingRoom(e.target.value)}
                placeholder="join room…"
                className="input"
                style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
              />
              <button type="submit" disabled={!pendingRoom.trim()} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
              </button>
            </form>
          </div>

          {/* Stats card */}
          <div className="glass-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1.5px", marginBottom: 10, textTransform: "uppercase" }}>
              Server
            </div>
            {[
              { label: "Users online", value: store.stats?.totalUsers ?? store.users.length },
              { label: "Active rooms", value: store.stats?.totalRooms ?? store.rooms.length },
              { label: "Messages", value: store.stats?.totalMessages ?? "—" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                <span style={{ color: "var(--text-muted)" }}>{s.label}</span>
                <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center — Messages ── */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          {/* Room header */}
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid var(--border-color)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>#</span> {store.activeRoom}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Talking as <span style={{ color: "var(--text-secondary)" }}>{chatUser?.username}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text-muted)" }}>group</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{store.users.length}</span>
            </div>
          </div>

          {/* Messages scroll area */}
          <div
            ref={messagesViewportRef}
            onScroll={(e) => {
              const t = e.currentTarget;
              setShowJumpToLatest(t.scrollHeight - t.scrollTop - t.clientHeight > 120);
            }}
            style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px", position: "relative", overscrollBehavior: "contain" }}
          >
            {store.isLoadingHistory && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 24 }}>Loading room history…</div>
            )}
            {!store.isLoadingHistory && store.messages.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "48px 0" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 8, opacity: 0.3 }}>forum</span>
                No messages yet in #{store.activeRoom}. Break the ice.
              </div>
            )}

            <div className="stack-xs">
              {store.messages.map((msg, i) => {
                const isOwn = msg.userId === chatUser?.id;
                const showAuthor = i === 0 || store.messages[i - 1]?.userId !== msg.userId;

                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "75%", padding: "8px 14px",
                      borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: isOwn ? "var(--gradient-prism)" : "var(--bg-secondary)",
                      color: isOwn ? "white" : "var(--text-primary)",
                      border: isOwn ? "none" : "1px solid var(--border-color)",
                    }}>
                      {showAuthor && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8, marginBottom: 2,
                          fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", opacity: 0.7,
                          textTransform: "uppercase",
                        }}>
                          <span>{msg.username}</span>
                          <span style={{ fontWeight: 400 }}>{formatMessageTime(msg.timestamp)}</span>
                        </div>
                      )}
                      <p style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {showJumpToLatest && (
              <div style={{ position: "sticky", bottom: 8, display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    messagesViewportRef.current?.scrollTo({ top: messagesViewportRef.current.scrollHeight, behavior: "smooth" });
                    setShowJumpToLatest(false);
                  }}
                  className="glass"
                  style={{
                    padding: "6px 16px", borderRadius: 16, border: "1px solid var(--border-color)",
                    fontSize: 11, fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)",
                    letterSpacing: "0.5px", textTransform: "uppercase",
                  }}
                >
                  ↓ Jump to latest
                </button>
              </div>
            )}
          </div>

          {/* Composer area */}
          <div style={{ borderTop: "1px solid var(--border-color)", padding: "12px 20px" }}>
            {typingLine && (
              <div style={{ fontSize: 11, color: "var(--primary)", marginBottom: 6, fontStyle: "italic" }}>
                {typingLine}
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); void store.sendMessage(); }}
              style={{ display: "flex", gap: 10, alignItems: "flex-end" }}
            >
              <textarea
                ref={composerRef}
                rows={1}
                value={store.draft}
                onChange={(e) => store.setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void store.sendMessage(); }
                }}
                placeholder={`Message #${store.activeRoom}`}
                disabled={store.connectionStatus !== "connected"}
                style={{
                  flex: 1, resize: "none", minHeight: 40, maxHeight: 120,
                  overflowY: "auto", lineHeight: 1.4,
                  background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius)", padding: "10px 14px",
                  color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-sans)",
                  outline: "none", transition: "border-color 0.15s",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {store.draft.trim().length}/500
                </span>
                <button
                  type="submit"
                  disabled={store.connectionStatus !== "connected" || !store.draft.trim()}
                  className="btn btn-primary"
                  style={{
                    padding: "8px 14px", borderRadius: "var(--radius)",
                    opacity: (!store.draft.trim() || store.connectionStatus !== "connected") ? 0.4 : 1,
                    cursor: (!store.draft.trim() || store.connectionStatus !== "connected") ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right sidebar — Members ── */}
        <div className="glass-card" style={{ padding: 16, alignSelf: "start" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1.5px", marginBottom: 12, textTransform: "uppercase",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Members</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>{store.users.length}</span>
          </div>

          {store.users.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0", textAlign: "center" }}>
              Waiting for presence…
            </div>
          ) : (
            <div className="stack-xs">
              {store.users.map((u) => {
                const isMe = u.id === chatUser?.id;
                return (
                  <div key={u.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 8px", borderRadius: "var(--radius)",
                    background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text-muted)" }}>person</span>
                      <span style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      {!isMe && (
                        <button
                          type="button"
                          title={`Add ${u.username} as friend`}
                          disabled={addingFriendId === u.id}
                          onClick={() => void handleAddFriend(u.id)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 22, height: 22, borderRadius: "50%",
                            border: "none", cursor: addingFriendId === u.id ? "not-allowed" : "pointer",
                            background: "transparent", color: "var(--text-muted)",
                            transition: "all 0.15s", padding: 0,
                            opacity: addingFriendId === u.id ? 0.4 : 1,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary)"; e.currentTarget.style.color = "white"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span>
                        </button>
                      )}
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Responsive styles ── */}
      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 260px"] {
            grid-template-columns: 220px minmax(0, 1fr) !important;
          }
          div[style*="grid-template-columns: 260px"] > div:last-child {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 260px"],
          div[style*="grid-template-columns: 220px"] {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto minmax(0, 1fr) !important;
            height: 78vh !important;
          }
        }
      `}</style>
    </div>
  );
}
