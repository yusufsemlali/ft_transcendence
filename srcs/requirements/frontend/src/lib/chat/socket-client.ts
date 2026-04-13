"use client";

import { io, Socket } from "socket.io-client";
import type { Message } from "@ft-transcendence/contracts";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ServerToClientEvents = {
  "connection:success": (payload: { message: string; socketId: string }) => void;
  "room:joined": (payload: { room: string; message: string }) => void;
  "message:new": (message: Message) => void;
  "messages:history": (messages: Message[]) => void;
  "users:list": (users: ChatUser[]) => void;
  "user:joined": (payload: { userId: string; username: string; message: string }) => void;
  "user:left": (payload: { userId: string; username: string; message: string }) => void;
  "user:typing": (payload: { userId: string; username: string; isTyping: boolean }) => void;
  "room:info": (payload: {
    room: string;
    userCount: number;
    users: ChatUser[];
    messageCount: number;
    createdAt: string | Date;
  }) => void;
  "server:stats": (payload: {
    totalUsers: number;
    totalMessages: number;
    totalRooms: number;
  }) => void;
  error: (message: string) => void;
};

export type ClientToServerEvents = {
  "user:join": (payload: { room: string }) => void;
  "message:send": (payload: { content: string }) => void;
  "user:typing": (payload: { isTyping: boolean }) => void;
  "room:getInfo": (payload: { room: string }) => void;
  "server:getStats": () => void;
};

export type ChatUser = {
  id: string;
  username: string;
  email?: string;
  role?: string;
};

function resolveChatUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_CHAT_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    
    // For localhost, use HTTP to avoid WSS protocol issues
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const httpPort = port || "80";
      return `http://${hostname}:${httpPort}`;
    }
    
    // For production, use the current origin
    return window.location.origin;
  }

  return "http://localhost:8080"; // Updated to match the actual port
}

function resolveChatPath(): string {
  return process.env.NEXT_PUBLIC_CHAT_SOCKET_PATH || "/socket.io";
}

export function createChatSocket(): ChatSocket {
  return io(resolveChatUrl(), {
    path: resolveChatPath(),
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: false,
  });
}

export function joinChatRoom(socket: ChatSocket, _user: ChatUser, room: string): void {
  socket.emit("user:join", { room });
}

export function sendChatMessage(socket: ChatSocket, content: string): void {
  socket.emit("message:send", { content });
}

export function setTypingState(socket: ChatSocket, isTyping: boolean): void {
  socket.emit("user:typing", { isTyping });
}

export function requestRoomInfo(socket: ChatSocket, room: string): void {
  socket.emit("room:getInfo", { room });
}

export function requestServerStats(socket: ChatSocket): void {
  socket.emit("server:getStats");
}
