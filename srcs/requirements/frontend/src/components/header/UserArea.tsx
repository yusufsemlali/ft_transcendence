"use client";

import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";

export function UserArea() {
  const { user, logout, isLoading } = useAuth();

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
          <button className="nav-icon" title="notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <UserMenu
            user={{
              username: user.username,
              level: user.level,
              avatar: user.avatar,
            }}
            onLogout={handleLogout}
          />
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
