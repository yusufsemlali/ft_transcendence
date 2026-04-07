"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "./NavLink";
import { UserArea } from "./UserArea";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Hide the header entirely on dashboard routes (it has its own sidebar)
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <>
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
    
            {/* Desktop nav links */}
            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <NavLink href="/dashboard" icon="dashboard" title="dashboard" />
              <NavLink href="/tournaments" icon="sports_esports" title="tournaments" />
              <NavLink href="/friends" icon="group" title="friends" />
              <NavLink href="/leaderboard" icon="social_leaderboard" title="leaderboard" />
              <NavLink href="/admin" icon="admin_panel_settings" title="admin" />
              <NavLink href="/settings" icon="settings" title="settings" />
            </div>
          </div>
    
          {/* Right side: User area + mobile hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <UserArea />
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {mobileOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>close</span>
          </button>

          <Link href="/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="nav-link-text">dashboard</span>
          </Link>
          <Link href="/tournaments" className="nav-link" onClick={() => setMobileOpen(false)}>
            <span className="material-symbols-outlined">sports_esports</span>
            <span className="nav-link-text">tournaments</span>
          </Link>
          <Link href="/friends" className="nav-link" onClick={() => setMobileOpen(false)}>
            <span className="material-symbols-outlined">group</span>
            <span className="nav-link-text">friends</span>
          </Link>
          <Link href="/leaderboard" className="nav-link" onClick={() => setMobileOpen(false)}>
            <span className="material-symbols-outlined">social_leaderboard</span>
            <span className="nav-link-text">leaderboard</span>
          </Link>
          <Link href="/admin" className="nav-link" onClick={() => setMobileOpen(false)}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span className="nav-link-text">admin</span>
          </Link>
          <Link href="/settings" className="nav-link" onClick={() => setMobileOpen(false)}>
            <span className="material-symbols-outlined">settings</span>
            <span className="nav-link-text">settings</span>
          </Link>
        </div>
      )}
    </>
  );
}
