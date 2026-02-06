import Link from "next/link";

interface ComingSoonProps {
    title: string;
    description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
    return (
        <main className="animate-fade-in" style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center"
        }}>
            <div style={{ color: "var(--accent-primary)", marginBottom: "1rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "4rem" }}>
                    construction
                </span>
            </div>

            <h1 style={{
                fontSize: "2.5rem",
                color: "var(--text-primary)",
                marginBottom: "1rem",
                textTransform: "lowercase"
            }}>
                {title}
            </h1>

            <div style={{
                fontSize: "1.1rem",
                color: "var(--accent-primary)",
                marginBottom: "1.5rem",
                fontFamily: "var(--font-mono)"
            }}>
                coming soon
            </div>

            <p style={{
                maxWidth: "500px",
                color: "var(--text-secondary)",
                marginBottom: "2.5rem",
                fontSize: "0.95rem"
            }}>
                {description || "we're working hard to bring this feature to life. stay tuned for updates!"}
            </p>

            <Link href="/" className="btn btn-secondary">
                go back
            </Link>
        </main>
    );
}
