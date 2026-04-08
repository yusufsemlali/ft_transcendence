"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "@/lib/api/api";
import {
  createChatSocket,
  joinChatRoom,
  requestServerStats,
  requestRoomInfo,
  sendChatMessage,
  setTypingState,
  type ChatSocket,
  type ChatUser,
} from "@/lib/chat";
import type { Message, Room } from "@ft-transcendence/contracts";
import { toast } from "@/components/ui/sonner";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
type ChatAvailability = "ready" | "login_required" | "session_expired" | "unavailable";

export interface ChatStats {
  totalUsers: number;
  totalMessages: number;
  totalRooms: number;
}

export interface ChatStoreState {
  socket: ChatSocket | null;
  connectionStatus: ConnectionStatus;
  availability: ChatAvailability;
  activeRoom: string;
  rooms: Room[];
  messages: Message[];
  users: ChatUser[];
  typingUsers: string[];
  stats: ChatStats | null;
  draft: string;
  isLoadingHistory: boolean;
  isSending: boolean;
  error: string | null;
  setDraft: (value: string) => void;
  selectRoom: (roomId: string) => Promise<void>;
  sendMessage: () => Promise<void>;
  retryConnection: () => void;
}

const DEFAULT_ROOM = "general";
const CHAT_ROOM_STORAGE_KEY = "chat.activeRoom";
const MAX_MESSAGE_LENGTH = 500;

function upsertRoom(rooms: Room[], roomId: string): Room[] {
  if (rooms.some((room) => room.id === roomId)) {
    return rooms;
  }

  return [
    {
      id: roomId,
      name: roomId,
      createdAt: new Date(),
    },
    ...rooms,
  ];
}

export function useChatStore(currentUser: ChatUser | null, initialRoom?: string): ChatStoreState {
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [availability, setAvailability] = useState<ChatAvailability>("ready");
  const [activeRoom, setActiveRoom] = useState(() => {
    if (initialRoom) return initialRoom;

    if (typeof window === "undefined") {
      return DEFAULT_ROOM;
    }

    const storedRoom = window.localStorage.getItem(CHAT_ROOM_STORAGE_KEY)?.trim();
    return storedRoom || DEFAULT_ROOM;
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [draft, setDraftValue] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinedRoomRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const roomRefreshTimerRef = useRef<number | null>(null);
  const lastRetryRef = useRef<number>(0);
  const socketRef = useRef<ChatSocket | null>(null);

  const loadRooms = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    const response = await api.chat.getRooms({});
    if (response.status === 200) {
      setRooms((existing) => {
        const fromApi = response.body;
        if (fromApi.some((room) => room.id === activeRoom)) {
          return fromApi;
        }
        return activeRoom ? upsertRoom(fromApi, activeRoom) : fromApi;
      });
    }
  }, [activeRoom, currentUser]);

  const loadStats = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    const response = await api.chat.getStats({});
    if (response.status === 200) {
      setStats({
        totalUsers: response.body.connectedUsers,
        totalMessages: response.body.totalMessages,
        totalRooms: response.body.activeRooms,
      });
    }
  }, [currentUser]);

  const loadRoomMessages = useCallback(async (roomId: string) => {
    setIsLoadingHistory(true);
    const response = await api.chat.getRoomMessages({
      params: { roomId },
      query: { limit: "50" },
    });

    if (response.status === 200) {
      setMessages(response.body);
      setError(null);
    } else if (response.status === 404) {
      setMessages([]);
    }

    setIsLoadingHistory(false);
  }, []);

  const joinCurrentRoomRef = useRef<(targetRoom: string) => void>(() => {});

  joinCurrentRoomRef.current = (targetRoom: string) => {
    const s = socketRef.current;
    if (!s || !currentUser || !targetRoom) {
      return;
    }

    joinedRoomRef.current = targetRoom;
    joinChatRoom(s, currentUser, targetRoom);
    requestRoomInfo(s, targetRoom);
    requestServerStats(s);
  };

  useEffect(() => {
    if (!currentUser) {
      setConnectionStatus("idle");
      setAvailability("login_required");
      setUsers([]);
      setTypingUsers([]);
      setMessages([]);
      setError(null);
      socketRef.current = null;
      return;
    }

    const nextSocket = createChatSocket();
    setSocket(nextSocket);
    socketRef.current = nextSocket;
    setConnectionStatus("connecting");

    const onConnect = () => {
      setConnectionStatus("connected");
      setAvailability("ready");
      setError(null);
      joinCurrentRoomRef.current(joinedRoomRef.current ?? activeRoom);
    };

    const onConnectError = (eventError?: { message?: string; description?: unknown }) => {
      setConnectionStatus("error");
      const message = eventError?.message || "";
      const isUnauthorized = message.toLowerCase().includes("unauthorized");

      if (isUnauthorized) {
        const nextAvailability = currentUser ? "session_expired" : "login_required";
        setAvailability(nextAvailability);
        setError(
          currentUser
            ? "Your chat session expired. Refresh your session or sign in again."
            : "Sign in to use chat.",
        );
        if (currentUser) {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return;
      }

      setAvailability("unavailable");
      setError("Unable to connect to chat right now.");
    };

    const onMessageHistory = (history: Message[]) => {
      setMessages(history);
      setIsLoadingHistory(false);
    };

    const onMessageNew = (message: Message) => {
      setMessages((existing) => [...existing, message]);
      setTypingUsers((existing) =>
        existing.filter((username) => username !== message.username),
      );
    };

    const onUsersList = (nextUsers: ChatUser[]) => {
      setUsers(nextUsers);
    };

    const onUserTyping = (payload: { username: string; isTyping: boolean }) => {
      setTypingUsers((existing) => {
        if (payload.isTyping) {
          return existing.includes(payload.username)
            ? existing
            : [...existing, payload.username];
        }

        return existing.filter((username) => username !== payload.username);
      });
    };

    const onRoomInfo = (payload: {
      room: string;
      userCount: number;
      messageCount: number;
    }) => {
      setStats((existing) =>
        existing
          ? {
              ...existing,
              totalUsers: Math.max(existing.totalUsers, payload.userCount),
            }
          : existing,
      );
    };

    const onServerStats = (payload: ChatStats) => {
      setStats(payload);
    };

    const onError = (message: string) => {
      setError(message);
      if (message.toLowerCase().includes("unauthorized")) {
        setAvailability(currentUser ? "session_expired" : "login_required");
      } else {
        toast.error(message);
      }
      setIsSending(false);
      setIsLoadingHistory(false);
    };

    nextSocket.on("connect", onConnect);
    nextSocket.on("connect_error", onConnectError);
    nextSocket.on("messages:history", onMessageHistory);
    nextSocket.on("message:new", onMessageNew);
    nextSocket.on("users:list", onUsersList);
    nextSocket.on("user:typing", onUserTyping);
    nextSocket.on("room:info", onRoomInfo);
    nextSocket.on("server:stats", onServerStats);
    nextSocket.on("error", onError);

    nextSocket.connect();

    return () => {
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      setSocket(null);
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    void loadRooms();
    void loadStats();
  }, [currentUser, loadRooms, loadStats]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CHAT_ROOM_STORAGE_KEY, activeRoom);
  }, [activeRoom]);

  useEffect(() => {
    if (!currentUser || connectionStatus !== "connected") {
      return;
    }

    // Clear stale typing state from previous room
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    startTransition(() => {
      setTypingUsers([]);
      setUsers([]);
    });
    void loadRoomMessages(activeRoom);
    joinCurrentRoomRef.current(activeRoom);
    setRooms((existing) => upsertRoom(existing, activeRoom));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom, connectionStatus, currentUser, loadRoomMessages]);

  const sendMessageAction = useCallback(async () => {
    const nextMessage = draft.trim().slice(0, MAX_MESSAGE_LENGTH);

    if (!socket || !nextMessage || connectionStatus !== "connected") {
      return;
    }

    setIsSending(true);
    sendChatMessage(socket, nextMessage);
    setDraftValue("");
    setTypingState(socket, false);
    setTimeout(() => {
      setIsSending(false);
    }, 150);
  }, [connectionStatus, draft, socket]);

  const retryConnection = useCallback(() => {
    if (!socket) {
      return;
    }

    // Guard against rapid-fire retries (2 second cooldown)
    const now = Date.now();
    if (now - lastRetryRef.current < 2000) {
      return;
    }
    lastRetryRef.current = now;

    setConnectionStatus("connecting");
    socket.connect();
  }, [socket]);

  const setDraft = useCallback((value: string) => {
    const nextValue = value.slice(0, MAX_MESSAGE_LENGTH);
    setDraftValue(nextValue);

    if (!socket || connectionStatus !== "connected") {
      return;
    }

    setTypingState(socket, nextValue.trim().length > 0);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      setTypingState(socket, false);
    }, 1200);
  }, [connectionStatus, socket]);

  const state = useMemo<ChatStoreState>(
    () => ({
      socket,
      connectionStatus,
      availability,
      activeRoom,
      rooms,
      messages,
      users,
      typingUsers,
      stats,
      draft,
      isLoadingHistory,
      isSending,
      error,
      setDraft,
      selectRoom: async (roomId: string) => {
        startTransition(() => {
          setError(null);
          setActiveRoom(roomId.trim() || DEFAULT_ROOM);
        });
      },
      sendMessage: async () => {
        await sendMessageAction();
      },
      retryConnection,
    }),
    [
      socket,
      connectionStatus,
      availability,
      activeRoom,
      rooms,
      messages,
      users,
      typingUsers,
      stats,
      draft,
      isLoadingHistory,
      isSending,
      error,
      setDraft,
      sendMessageAction,
      retryConnection,
    ],
  );

  return state;
}
