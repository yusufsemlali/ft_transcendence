"use client";


/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface UserInfo {
    username: string;
    level: number;
    avatar: string;
}

interface UserMenuProps {
    user: UserInfo;
    onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`nav-user-btn ${isOpen ? "active" : ""}`}
                title="user menu"
                style={{ padding: "0.15rem 0.5rem" }}
            >
                <img
                    src={user.avatar}
                    alt={user.username}
                    style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid var(--border-color)"
                    }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                    }}
                />
                <span className="nav-username">{user.username}</span>
                <span className="nav-level">{user.level}</span>
            </button>

            {isOpen && (
                <div className="dropdown absolute right-0 top-full mt-2 z-50 animate-fade-in">
                    <Link href="/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>account_circle</span>
                        profile
                    </Link>
                    <Link href="/settings" className="dropdown-item" onClick={() => setIsOpen(false)}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>settings</span>
                        settings
                    </Link>
                    <div style={{ borderTop: "1px solid var(--border-color)", margin: "0.25rem 0" }} />
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onLogout();
                        }}
                        className="dropdown-item"
                        style={{ width: "100%", textAlign: "left" }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
                        sign out
                    </button>
                </div>
            )}
        </div>
    );
}
