import Link from "next/link";
import { useAuth } from "@/lib/store/hooks";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();

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
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
          <Link href="/profile" className="dashboard-topbar-user" title={user.username}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)" }}>
                {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}
