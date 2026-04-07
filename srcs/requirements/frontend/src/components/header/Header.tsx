"use client";

import Link from "next/link";
import { NavLink } from "./NavLink";
import { UserArea } from "./UserArea";

export function Header() {
  return (
    <nav className="nav">
      <div style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
      }}>
        {/* Left side: Logo + Navigation Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Link href="/dashboard" className="nav-logo" style={{ marginRight: "0.75rem" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "inherit", color: "var(--accent-primary)" }}
            >
              trophy
            </span>
            <span>tournify</span>
          </Link>

          <NavLink href="/dashboard" icon="dashboard" title="Dashboard" />
          <NavLink href="/tournaments" icon="sports_esports" title="Tournaments" />
          <NavLink href="/organizations" icon="corporate_fare" title="Organizations" />
          <NavLink href="/friends" icon="group" title="Friends" />
          <NavLink href="/leaderboard" icon="social_leaderboard" title="Leaderboard" />

          <div style={{ width: "1px", height: "16px", background: "var(--border-color)", margin: "0 0.25rem", opacity: 0.3 }} />

          <NavLink href="/profile" icon="person" title="Profile" />
          <NavLink href="/account-settings" icon="manage_accounts" title="Account Settings" />
          <NavLink href="/settings" icon="tune" title="Settings" />
          <NavLink href="/admin/sports" icon="sports" title="Admin: Sports" />
        </div>
  
        {/* Right side: User area */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <UserArea />
        </div>
      </div>
    </nav>
  );
}
