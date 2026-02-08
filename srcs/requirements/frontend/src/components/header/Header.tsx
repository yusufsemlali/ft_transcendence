"use client";

import Link from "next/link";
import { NavLink } from "./NavLink";
import { UserArea } from "./UserArea";
import { UserInfo } from "@/lib/auth";

interface HeaderProps {
  initialUser: UserInfo | null;
}

export function Header({ initialUser }: HeaderProps) {
  return (
    <nav className="nav">
      {/* Left side: Logo + Navigation Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link href="/" className="nav-logo" style={{ marginRight: "0.5rem" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "inherit", color: "var(--accent-primary)" }}
          >
            trophy
          </span>
          <span>tournify</span>
        </Link>

        <NavLink
          href="/tournaments"
          icon="sports_esports"
          title="tournaments"
        />
        <NavLink
          href="/leaderboard"
          icon="social_leaderboard"
          title="leaderboard"
        />
        <NavLink href="/about" icon="info" title="about" />
        <NavLink href="/settings" icon="settings" title="settings" />
      </div>

      {/* Right side: User area */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <UserArea initialUser={initialUser} />
      </div>
    </nav>
  );
}
