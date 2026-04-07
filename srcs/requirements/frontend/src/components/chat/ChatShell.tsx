"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

function formatMessageTime(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatShell() {
  const { user, isAuthenticated } = useAuth();
  const [pendingRoom, setPendingRoom] = useState("");
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const chatUser = useMemo(() => {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.displayName || user.username,
      email: user.email,
    };
  }, [user]);

  const store = useChatStore(chatUser);

  useEffect(() => {
    composerRef.current?.focus();
  }, [store.activeRoom]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) {
      return;
    }

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const shouldStickToBottom = distanceFromBottom < 120;

    if (shouldStickToBottom) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      setShowJumpToLatest(false);
      return;
    }

    setShowJumpToLatest(true);
  }, [store.messages, store.activeRoom]);

  const statusMessage =
    store.typingUsers.length > 0
      ? `${store.typingUsers.join(", ")} typing...`
      : store.connectionStatus === "connecting"
        ? "Connecting to live chat..."
        : store.connectionStatus === "error"
          ? store.error || "Live connection interrupted."
          : store.error || "Press Enter to send, Shift+Enter for a new line.";

  if (!isAuthenticated || !user) {
    return (
      <Page className="mx-auto max-w-4xl px-4 py-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Team Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Sign in to join rooms, see presence, and send messages in real time.</p>
            <a href="/login" className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Go to login
            </a>
          </CardContent>
        </Card>
      </Page>
    );
  }

  if (store.availability === "session_expired") {
    return (
      <Page className="mx-auto max-w-4xl px-4 py-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Chat Session Expired</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Your account session is no longer valid for chat. Sign in again to reconnect securely.</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login?callbackUrl=%2Fchat"
                className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Sign in again
              </Link>
              <button
                type="button"
                onClick={store.retryConnection}
                className="inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </Page>
    );
  }

  if (store.availability === "unavailable") {
    return (
      <Page className="mx-auto max-w-4xl px-4 py-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Chat Temporarily Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>The chat service is reachable from the page, but the live connection could not be established right now.</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={store.retryConnection}
                className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Retry connection
              </button>
              <Link
                href="/"
                className="inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground"
              >
                Back home
              </Link>
            </div>
          </CardContent>
        </Card>
      </Page>
    );
  }

  return (
    <Page className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      {store.connectionStatus !== "connected" ? (
        <div className="rounded-[1.6rem] border border-border/50 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
          {store.connectionStatus === "connecting"
            ? "Connecting to the room. Live updates will appear in a moment."
            : "Chat is not fully connected right now. You can still browse history while reconnecting."}
        </div>
      ) : null}
      <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/50">
          <CardHeader className="mb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Rooms</CardTitle>
                <p className="text-sm text-muted-foreground">Switch channels or create a quick room.</p>
              </div>
              <Badge
                variant={
                  store.connectionStatus === "connected"
                    ? "success"
                    : store.connectionStatus === "error"
                      ? "destructive"
                      : "secondary"
                }
              >
                {store.connectionStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {store.rooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                  No active rooms yet. Start with <span className="font-semibold text-foreground">general</span>.
                </div>
              ) : (
                store.rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => void store.selectRoom(room.id)}
                    disabled={room.id === store.activeRoom}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition disabled:cursor-default",
                      room.id === store.activeRoom
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">#{room.name}</span>
                      {room.id === store.activeRoom ? <Badge>live</Badge> : null}
                    </div>
                  </button>
                ))
              )}
            </div>

            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!pendingRoom.trim()) {
                  return;
                }
                void store.selectRoom(pendingRoom.trim().toLowerCase());
                setPendingRoom("");
              }}
            >
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Quick room
              </label>
              <div className="flex gap-2">
                <input
                  value={pendingRoom}
                  onChange={(event) => setPendingRoom(event.target.value)}
                  placeholder="scrims"
                  className="min-w-0 flex-1 rounded-full border border-border bg-background/70 px-4 py-2 text-sm outline-none transition focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!pendingRoom.trim()}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Join
                </button>
              </div>
            </form>

            <div className="grid gap-2 rounded-3xl border border-border/50 bg-background/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Users online</span>
                <span className="font-semibold">{store.stats?.totalUsers ?? store.users.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active rooms</span>
                <span className="font-semibold">{store.stats?.totalRooms ?? store.rooms.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Messages served</span>
                <span className="font-semibold">{store.stats?.totalMessages ?? store.messages.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>#{store.activeRoom}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Talking as {chatUser?.username}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{store.users.length} here</Badge>
                {store.connectionStatus === "error" ? (
                  <button
                    type="button"
                    onClick={store.retryConnection}
                    className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="flex min-h-[60vh] flex-col gap-4">
              <div className="flex-1 overflow-hidden rounded-[2rem] border border-border/50 bg-background/45">
              <div className="flex h-full flex-col">
                  <div
                    ref={messagesViewportRef}
                    onScroll={(event) => {
                      const viewport = event.currentTarget;
                      const distanceFromBottom =
                        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
                      setShowJumpToLatest(distanceFromBottom > 120);
                    }}
                    className="relative flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6"
                  >
                    {store.isLoadingHistory ? (
                      <div className="text-sm text-muted-foreground">Loading room history...</div>
                    ) : null}

                    {!store.isLoadingHistory && store.messages.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground">
                        No messages yet in #{store.activeRoom}. Break the ice.
                      </div>
                    ) : null}

                    {store.messages.map((message, index) => {
                      const isOwnMessage = message.userId === chatUser?.id;
                      const showAuthor =
                        index === 0 || store.messages[index - 1]?.userId !== message.userId;

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            isOwnMessage ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-[1.6rem] px-4 py-3 shadow-sm",
                              isOwnMessage
                                ? "bg-[var(--gradient-prism)] text-white"
                                : "border border-border/50 bg-card text-card-foreground",
                            )}
                          >
                            {showAuthor ? (
                              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                                <span>{message.username}</span>
                                <span>{formatMessageTime(message.timestamp)}</span>
                              </div>
                            ) : null}
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                          </div>
                        </div>
                      );
                    })}

                    {showJumpToLatest ? (
                      <div className="sticky bottom-3 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const viewport = messagesViewportRef.current;
                            if (!viewport) {
                              return;
                            }
                            viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
                            setShowJumpToLatest(false);
                          }}
                          className="rounded-full border border-border/60 bg-background/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm backdrop-blur"
                        >
                          Jump to latest
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-border/50 px-4 py-4 sm:px-6">
                    <div className="min-h-6 text-xs text-muted-foreground">
                      {statusMessage}
                    </div>
                    <form
                      className="mt-3 flex gap-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void store.sendMessage();
                      }}
                    >
                      <textarea
                        ref={composerRef}
                        value={store.draft}
                        onChange={(event) => store.setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void store.sendMessage();
                          }
                        }}
                        placeholder={`Message #${store.activeRoom}`}
                        disabled={store.connectionStatus !== "connected"}
                        className="min-h-24 flex-1 resize-none rounded-[1.75rem] border border-border bg-background/70 px-5 py-4 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <div className="flex min-w-28 flex-col items-end justify-between gap-3">
                        <div className="text-xs text-muted-foreground">
                          {store.draft.trim().length}/500
                        </div>
                        <button
                          type="submit"
                          disabled={store.connectionStatus !== "connected" || !store.draft.trim()}
                          className="self-end rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {store.isSending ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[2rem] border border-border/50 bg-background/45 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Members
                  </h2>
                  <Badge variant="secondary">{store.users.length}</Badge>
                </div>
                <div className="space-y-2">
                  {store.users.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Waiting for presence data...</div>
                  ) : (
                    store.users.map((roomUser) => (
                      <div
                        key={roomUser.id}
                        className="flex items-center justify-between rounded-2xl border border-border/50 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-medium">{roomUser.username}</div>
                          <div className="text-xs text-muted-foreground">{roomUser.email}</div>
                        </div>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/50 bg-background/45 p-4 text-sm text-muted-foreground">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em]">How It Works</h2>
                <p>The room list comes from the typed backend API, while live messages and presence stream over Socket.IO.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </Page>
  );
}
