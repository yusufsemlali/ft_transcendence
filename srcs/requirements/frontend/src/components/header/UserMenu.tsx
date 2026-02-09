"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface UserInfo {
  username: string;
  level: number;
  avatar: string;
}

interface UserMenuProps {
  user: UserInfo;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`nav-user-btn ${isOpen ? "active" : ""}`}
        title="user menu"
        style={{ padding: "0.25rem 0.5rem", gap: "0.5rem" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "22px", color: "var(--text-muted)" }}
        >
          person
        </span>
        <span
          className="nav-username"
          style={{ fontWeight: "500", color: "rgba(255,255,255,0.5)" }}
        >
          {user.username}
        </span>
        <span
          className="nav-level"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {user.level}
        </span>
      </button>

      {isOpen && (
        <div
          data-slot="card"
          className="absolute right-0 top-full mt-3 z-50 animate-fade-in min-w-[190px]"
          style={{
            padding: "0.4rem",
            overflow: "hidden",
          }}
        >
          <Link
            href="/stats"
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
            style={{
              fontSize: "11px",
              gap: "0.6rem",
              padding: "0.4rem 0.6rem",
            }}
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: "16px", opacity: 0.8 }}
            >
              query_stats
            </span>
            <span className="font-bold uppercase tracking-wider">
              User stats
            </span>
          </Link>
          <Link
            href="/friends"
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
            style={{
              fontSize: "11px",
              gap: "0.6rem",
              padding: "0.4rem 0.6rem",
            }}
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: "16px", opacity: 0.8 }}
            >
              group
            </span>
            <span className="font-bold uppercase tracking-wider">Friends</span>
          </Link>
          <Link
            href="/profile"
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
            style={{
              fontSize: "11px",
              gap: "0.6rem",
              padding: "0.4rem 0.6rem",
              background: "oklch(0.623 0.226 344 / 0.15)",
              color: "white",
              borderRadius: "6px",
            }}
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: "16px", color: "var(--primary)" }}
            >
              public
            </span>
            <span className="font-black uppercase tracking-widest">
              Public profile
            </span>
          </Link>
          <Link
            href="/settings"
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
            style={{
              fontSize: "11px",
              gap: "0.6rem",
              padding: "0.4rem 0.6rem",
            }}
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: "16px", opacity: 0.8 }}
            >
              settings
            </span>
            <span className="font-bold uppercase tracking-wider">
              Account settings
            </span>
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="dropdown-item"
            style={{
              width: "100%",
              textAlign: "left",
              fontSize: "11px",
              gap: "0.6rem",
              padding: "0.4rem 0.6rem",
            }}
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: "16px", opacity: 0.8 }}
            >
              logout
            </span>
            <span className="font-bold uppercase tracking-wider">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
