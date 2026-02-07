import Link from "next/link";

export default function NotFound() {
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
            <div style={{ fontSize: "6rem", fontWeight: "bold", color: "var(--accent-primary)", lineHeight: 1 }}>
                404
            </div>
            <div style={{
                fontSize: "1.5rem",
                color: "var(--text-primary)",
                marginTop: "1rem",
                fontFamily: "var(--font-mono)"
            }}>
                page not found
            </div>
            <div style={{
                maxWidth: "400px",
                color: "var(--text-secondary)",
                marginTop: "1.5rem",
                marginBottom: "2.5rem",
                fontSize: "0.9rem"
            }}>
                the page you are looking for doesn&apos;t exist or has been moved to another dimension.
            </div>

            <Link href="/" className="btn btn-primary">
                go back home
            </Link>
        </main>
    );
}
