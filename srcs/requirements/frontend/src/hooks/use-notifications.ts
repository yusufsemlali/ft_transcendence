"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api/api";
import { toast } from "@/components/ui/sonner";
import type { Notification } from "@ft-transcendence/contracts";

export interface SseNotificationPayload {
    userId: string;
    type?: string;
    refId?: string | null;
}

export type SseNotificationListener = (payload: SseNotificationPayload) => void;

const sseListeners = new Set<SseNotificationListener>();

export function addSseNotificationListener(fn: SseNotificationListener): () => void {
    sseListeners.add(fn);
    return () => { sseListeners.delete(fn); };
}

export interface UseNotificationsReturn {
    unreadCount: number;
    notifications: Notification[];
    isLoading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.notifications.getUnreadCount({});
            if (res.status === 200) {
                setUnreadCount(res.body.count);
            }
        } catch {}
    }, []);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.notifications.getNotifications({
                query: { limit: "20" },
            });
            if (res.status === 200) {
                setNotifications(res.body);
            }
        } catch {}
        setIsLoading(false);
    }, []);

    const refresh = useCallback(async () => {
        await Promise.all([fetchUnreadCount(), fetchNotifications()]);
    }, [fetchUnreadCount, fetchNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            const res = await api.notifications.markAsRead({ params: { id }, body: {} });
            if (res.status === 200) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch {}
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const res = await api.notifications.markAllAsRead({ body: {} });
            if (res.status === 200) {
                setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
                setUnreadCount(0);
            }
        } catch {}
    }, []);

    useEffect(() => {
        if (!userId) return;

        fetchUnreadCount();
        fetchNotifications();

        const es = new EventSource("/api/notifications/stream", {
            withCredentials: true,
        });
        eventSourceRef.current = es;

        es.addEventListener("notification", (event) => {
            fetchUnreadCount();
            fetchNotifications();
            toast.info("You have a new notification");

            let payload: SseNotificationPayload = { userId: userId! };
            try {
                const parsed = JSON.parse(event.data);
                if (parsed && typeof parsed === "object") {
                    payload = parsed as SseNotificationPayload;
                }
            } catch {}

            for (const listener of sseListeners) {
                try { listener(payload); } catch {}
            }
        });

        es.onerror = () => {
            // EventSource auto-reconnects; on reconnect we catch up
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, [userId, fetchUnreadCount, fetchNotifications]);

    return {
        unreadCount,
        notifications,
        isLoading,
        markAsRead,
        markAllAsRead,
        refresh,
    };
}
