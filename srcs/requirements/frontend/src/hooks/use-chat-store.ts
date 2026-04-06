"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
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

export interface ChatStats {
  totalUsers: number;
  totalMessages: number;
  totalRooms: number;
}

export interface ChatStoreState {
  socket: ChatSocket | null;
  connectionStatus: ConnectionStatus;
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

export function useChatStore(currentUser: ChatUser | null): ChatStoreState {
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [activeRoom, setActiveRoom] = useState(DEFAULT_ROOM);
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

  const loadRooms = useEffectEvent(async () => {
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
  });

  const loadStats = useEffectEvent(async () => {
    const response = await api.chat.getStats({});
    if (response.status === 200) {
      setStats({
        totalUsers: response.body.connectedUsers,
        totalMessages: response.body.totalMessages,
        totalRooms: response.body.activeRooms,
      });
    }
  });

  const loadRoomMessages = useEffectEvent(async (roomId: string) => {
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
  });

  const joinCurrentRoom = useEffectEvent((targetRoom: string) => {
    if (!socket || !currentUser || !targetRoom) {
      return;
    }

    joinedRoomRef.current = targetRoom;
    joinChatRoom(socket, currentUser, targetRoom);
    requestRoomInfo(socket, targetRoom);
    requestServerStats(socket);
  });

  useEffect(() => {
    if (!currentUser) {
      setConnectionStatus("idle");
      setUsers([]);
      setTypingUsers([]);
      setMessages([]);
      return;
    }

    const nextSocket = createChatSocket();
    setSocket(nextSocket);
    setConnectionStatus("connecting");

    const onConnect = () => {
      setConnectionStatus("connected");
      setError(null);
      joinCurrentRoom(joinedRoomRef.current ?? activeRoom);
    };

    const onConnectError = () => {
      setConnectionStatus("error");
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
      toast.error(message);
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
    };
  }, [currentUser, joinCurrentRoom]);

  useEffect(() => {
    void loadRooms();
    void loadStats();
  }, [loadRooms, loadStats]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    roomRefreshTimerRef.current = window.setInterval(() => {
      void loadRooms();
      void loadStats();
    }, 15000);

    return () => {
      if (roomRefreshTimerRef.current) {
        window.clearInterval(roomRefreshTimerRef.current);
      }
    };
  }, [currentUser, loadRooms, loadStats]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      if (roomRefreshTimerRef.current) {
        window.clearInterval(roomRefreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser || connectionStatus !== "connected") {
      return;
    }

    startTransition(() => {
      setTypingUsers([]);
      setUsers([]);
    });
    void loadRoomMessages(activeRoom);
    joinCurrentRoom(activeRoom);
    setRooms((existing) => upsertRoom(existing, activeRoom));
  }, [activeRoom, connectionStatus, currentUser, joinCurrentRoom, loadRoomMessages]);

  const sendMessageAction = useEffectEvent(async () => {
    if (!socket || !draft.trim() || connectionStatus !== "connected") {
      return;
    }

    setIsSending(true);
    sendChatMessage(socket, draft.trim());
    setDraftValue("");
    setTypingState(socket, false);
    setTimeout(() => {
      setIsSending(false);
    }, 150);
  });

  const retryConnection = useEffectEvent(() => {
    if (!socket) {
      return;
    }

    setConnectionStatus("connecting");
    socket.connect();
  });

  const setDraft = useEffectEvent((value: string) => {
    setDraftValue(value);

    if (!socket || connectionStatus !== "connected") {
      return;
    }

    setTypingState(socket, value.trim().length > 0);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      setTypingState(socket, false);
    }, 1200);
  });

  const state = useMemo<ChatStoreState>(
    () => ({
      socket,
      connectionStatus,
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
