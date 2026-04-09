"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserInfo } from "@/lib/types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  user: UserInfo;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const pathname = usePathname();
  const showAdminLink = user.role === "admin" || user.role === "moderator";

  const items: { href: string; icon: string; label: string; adminOnly?: boolean }[] = [
    { href: "/profile", icon: "person", label: "Profile" },
    { href: "/friends", icon: "group", label: "Friends" },
    { href: "/account-settings", icon: "manage_accounts", label: "Account settings" },
    { href: "/admin", icon: "admin_panel_settings", label: "Admin panel", adminOnly: true },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="nav-user-btn"
        title="user menu"
        style={{ padding: "0.25rem 0.5rem", gap: "0.5rem" }}
      >
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)" }}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--primary)" }}>
              {(user.username || "U").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span
          className="nav-username"
          style={{ fontWeight: "600", color: "rgba(255,255,255,0.8)", fontSize: "13px" }}
        >
          {user.username}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8}>
        {items.map((item) => {
          if (item.adminOnly && !showAdminLink) return null;
          const active = pathname === item.href;
          return (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className={active ? "dropdown-menu-item--active" : ""}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <span className="material-symbols-outlined">logout</span>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
