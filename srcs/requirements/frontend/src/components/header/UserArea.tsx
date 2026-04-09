"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/lib/store/hooks";
import { useNotifications } from "@/hooks/use-notifications";

export function UserArea() {
  const { user, logout, isLoading } = useAuth();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div
        className="user-area-container"
        style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            animation: "spin 1s linear infinite",
            color: "var(--text-secondary)",
          }}
        >
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div
      className="user-area-container"
      style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
    >
      {user ? (
        <>
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              className="nav-icon"
              title="notifications"
              onClick={() => setShowDropdown((prev) => !prev)}
              style={{ position: "relative" }}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: "var(--destructive, #ef4444)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div
                className="glass-card"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 340,
                  maxHeight: 400,
                  overflowY: "auto",
                  zIndex: 1000,
                  padding: 0,
                  border: "1px solid var(--border-color)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => void markAllAsRead()}
                      style={{
                        fontSize: 11,
                        color: "var(--primary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  >
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.readAt) void markAsRead(n.id);
                      }}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border-color)",
                        cursor: n.readAt ? "default" : "pointer",
                        background: n.readAt ? "transparent" : "color-mix(in srgb, var(--primary) 5%, transparent)",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        transition: "background 0.15s",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }}
                      >
                        {n.type === "friend_request"
                          ? "person_add"
                          : n.type === "tournament_invite"
                            ? "emoji_events"
                            : n.type === "match_starting"
                              ? "sports_esports"
                              : "notifications"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: n.readAt ? 400 : 600,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.title}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {!n.readAt && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--primary)",
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <UserMenu user={user} onLogout={handleLogout} />
        </>
      ) : (
        <Link
          href="/login"
          className="nav-icon"
          title="sign in"
          style={{
            color: "var(--text-secondary)",
            width: "auto",
            gap: "0.5rem",
            padding: "0 0.5rem",
          }}
        >
          <span className="material-symbols-outlined">account_circle</span>
          <span style={{ fontSize: "12px", fontWeight: "500" }}>sign in</span>
        </Link>
      )}
    </div>
  );
}
