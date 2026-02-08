"use client";

import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { UserInfo, logoutAction } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UserAreaProps {
  initialUser: UserInfo | null;
}

export function UserArea({ initialUser }: UserAreaProps) {
  const handleLogout = async () => {
    try {
      await logoutAction(); 
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("token");
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      className="user-area-container"
      style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
    >
      {initialUser ? (
        <>
          <button className="nav-icon" title="notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <UserMenu user={initialUser} onLogout={handleLogout} />
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
