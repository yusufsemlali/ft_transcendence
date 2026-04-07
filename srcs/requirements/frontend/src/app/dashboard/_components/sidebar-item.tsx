import Link from "next/link";

export function SidebarItem({ icon, label, active, onClick, badge, href }: {
  icon: string; label: string; active?: boolean; onClick?: () => void; badge?: string; href?: string;
}) {
  const cls = active ? "dashboard-sidebar-item active" : "dashboard-sidebar-item";
  const inner = (
    <>
      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{icon}</span>
      <span className="dashboard-sidebar-label">{label}</span>
      {badge && <span className="dashboard-sidebar-badge">{badge}</span>}
    </>
  );

  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button onClick={onClick} className={cls}>{inner}</button>;
}
