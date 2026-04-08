"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { UserInfo } from "@/lib/types/user";

interface UserMenuProps {
  user: UserInfo;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  /** Backend: admin panel listUsers is admin-only; moderators have partial admin API access */
  const showAdminLink = user.role === "admin" || user.role === "moderator";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items: { href: string; icon: string; label: string; adminOnly?: boolean; destructive?: boolean }[] = [
    { href: "/profile", icon: "person", label: "Profile" },
    { href: "/friends", icon: "group", label: "Friends" },
    { href: "/account-settings", icon: "manage_accounts", label: "Account settings" },
    { href: "/admin", icon: "admin_panel_settings", label: "Admin panel", adminOnly: true },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`nav-user-btn ${isOpen ? "active" : ""}`}
        title="user menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
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
      </button>

      {isOpen && (
        <div
          className="dropdown-menu-panel absolute right-0 top-full mt-3 animate-fade-in"
          role="menu"
        >
          {items.map((item) => {
            if (item.adminOnly && !showAdminLink) return null;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={`dropdown-menu-item${active ? " dropdown-menu-item--active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          <div className="dropdown-menu-separator" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="dropdown-menu-item dropdown-menu-item--destructive"
          >
            <span className="material-symbols-outlined">logout</span>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
