"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function RegisterForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [verifyPassword, setVerifyPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        if (password !== verifyPassword) {
            toast.error("Passwords do not match", { description: "Validation Error" });
            setLoading(false);
            return;
        }

        try {
            const response = await api.auth.register({
                body: { email, username, password }
            });

            if (response.status === 201) {
                const token = (response.body as any).token;
                localStorage.setItem("token", token);
                document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

                toast.success("Account created successfully!");
                router.push("/");
                router.refresh();
            } else {
                const body = response.body as any;
                if (body?.errors && Array.isArray(body.errors)) {
                    const messages = body.errors.map((e: any) => `${e.path?.join(".")}: ${e.message}`);
                    toast.error(messages.join(", "), { description: "Failed to create account" });
                } else {
                    toast.error(body?.message || "Registration failed", { description: "Failed to create account" });
                }
            }
        } catch (err) {
            toast.error("An unexpected error occurred", { description: "Failed to create account" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ width: "100%", maxWidth: "320px" }}>
            <div className="section">
                <div className="section-header">
                    <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="section-title">register</span>
                </div>
            </div>

            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: "1rem" }}>
                    <input
                        type="text"
                        required
                        className="input"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <input
                        type="email"
                        required
                        className="input"
                        placeholder="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <input
                        type="email"
                        required
                        className="input"
                        placeholder="verify email"
                        autoComplete="off"
                    />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <input
                        type="password"
                        required
                        className="input"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <input
                        type="password"
                        required
                        className="input"
                        placeholder="verify password"
                        value={verifyPassword}
                        onChange={(e) => setVerifyPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-secondary"
                    style={{ width: "100%", justifyContent: "center" }}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    {loading ? "signing up..." : "sign up"}
                </button>
            </form>
        </div>
    );
}
