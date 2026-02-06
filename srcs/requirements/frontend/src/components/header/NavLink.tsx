"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
    href: string;
    icon: string;
    title: string;
}

export function NavLink({ href, icon, title }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`nav-icon ${isActive ? "active" : ""}`}
            title={title}
        >
            <span className="material-symbols-outlined">{icon}</span>
        </Link>
    );
}
