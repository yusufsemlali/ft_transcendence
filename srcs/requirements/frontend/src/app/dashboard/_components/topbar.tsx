import Link from "next/link";
import { useAuth } from "@/lib/store/hooks";
import { UserMenu } from "@/components/header/UserMenu";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-topbar">
      {/* Left: mobile menu + search */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        <button className="dashboard-topbar-btn show-mobile" onClick={onMenuClick} style={{ display: "none" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>menu</span>
        </button>
        <div className="dashboard-search">
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>search</span>
          <input type="text" placeholder="Search tournaments, members..." className="dashboard-search-input" />
        </div>
      </div>

      {/* Right: action icons + user */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Link href="/" className="dashboard-topbar-btn" title="Home">
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>home</span>
        </Link>
        <Link href="/tournaments" className="dashboard-topbar-btn" title="Tournaments">
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>sports_esports</span>
        </Link>
        <button className="dashboard-topbar-btn" title="Notifications">
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>notifications</span>
        </button>
        <button className="dashboard-topbar-btn" title="Help">
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>help_outline</span>
        </button>
        <Link href="/settings" className="dashboard-topbar-btn" title="Settings">
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>settings</span>
        </Link>
        {user && (
          <div style={{ marginLeft: "4px" }}>
            <UserMenu 
              user={user} 
              onLogout={() => logout()} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
