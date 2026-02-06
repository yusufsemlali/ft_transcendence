"use client";

import Link from "next/link";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function LoginPage() {
    return (
        <main className="flex-1 flex items-center justify-center animate-fade-in" style={{ gap: "4rem", padding: "2rem" }}>
            <RegisterForm />
            <LoginForm />
        </main>
    );
}
