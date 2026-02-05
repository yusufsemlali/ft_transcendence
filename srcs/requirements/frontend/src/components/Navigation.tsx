"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface UserInfo {
    username: string;
    level: number;
}

export function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
            // In real app, decode JWT or fetch user info
            // For now, use placeholder
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    setUser({ username: "user", level: 1 });
                }
            } else {
                setUser({ username: "user", level: 1 });
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        setUser(null);
        setShowUserMenu(false);
        router.push("/");
    };

    return (
        <nav className="nav">
            {/* Left side: Logo + nav icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Link href="/" className="nav-logo">
                    <span className="nav-logo-icon">⊞</span>
                    <span>tournify</span>
                </Link>

                {/* Nav icons with Material Symbols */}
                <Link
                    href="/tournaments"
                    className={`nav-icon ${pathname === "/tournaments" ? "active" : ""}`}
                    title="tournaments"
                >
                    <span className="material-symbols-outlined">sports_esports</span>
                </Link>
                <Link
                    href="/leaderboard"
                    className={`nav-icon ${pathname === "/leaderboard" ? "active" : ""}`}
                    title="leaderboard"
                >
                    <span className="material-symbols-outlined">social_leaderboard</span>
                </Link>
                <Link
                    href="/about"
                    className={`nav-icon ${pathname === "/about" ? "active" : ""}`}
                    title="about"
                >
                    <span className="material-symbols-outlined">info</span>
                </Link>
                <Link
                    href="/settings"
                    className={`nav-icon ${pathname === "/settings" ? "active" : ""}`}
                    title="settings"
                >
                    <span className="material-symbols-outlined">settings</span>
                </Link>
            </div>

            {/* Right side: User area */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {isAuthenticated && user ? (
                    <>
                        <button className="nav-icon" title="notifications">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="nav-user-btn"
                                title="user menu"
                            >
                                <span className="material-symbols-outlined">account_circle</span>
                                <span className="nav-username">{user.username}</span>
                                <span className="nav-level">{user.level}</span>
                            </button>

                            {showUserMenu && (
                                <div className="dropdown absolute right-0 top-full mt-2 z-50">
                                    <Link href="/profile" className="dropdown-item">
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>account_circle</span>
                                        profile
                                    </Link>
                                    <Link href="/settings" className="dropdown-item">
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>settings</span>
                                        settings
                                    </Link>
                                    <div style={{ borderTop: "1px solid var(--border-color)", margin: "0.25rem 0" }} />
                                    <button onClick={handleLogout} className="dropdown-item" style={{ width: "100%" }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
                                        sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <Link href="/login" className="nav-icon" title="sign in">
                        <span className="material-symbols-outlined">account_circle</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
