"use client";

import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { UserInfo, logoutAction } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface UserAreaProps {
    initialUser: UserInfo | null;
}

export function UserArea({ initialUser }: UserAreaProps) {
    const router = useRouter();

    const handleLogout = async () => {
        // Clear client state
        localStorage.removeItem("token");
        // Trigger server-side logout (clears cookie)
        await logoutAction();
        // Refresh page to update state globally
        router.push("/login");
        router.refresh();
    };

    return (
        <>
            {initialUser ? (
                <>
                    <button className="nav-icon" title="notifications">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <UserMenu user={initialUser} onLogout={handleLogout} />
                </>
            ) : (
                <Link href="/login" className="nav-icon" title="sign in">
                    <span className="material-symbols-outlined">account_circle</span>
                </Link>
            )}
        </>
    );
}