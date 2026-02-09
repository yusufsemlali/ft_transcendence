import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <main
      className="animate-fade-in"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ color: "var(--accent-primary)", marginBottom: "0.75rem" }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "3.5rem" }}
        >
          construction
        </span>
      </div>

      <h1
        style={{
          fontSize: "2.5rem",
          color: "var(--text-primary)",
          marginBottom: "1rem",
          textTransform: "lowercase",
        }}
      >
        {title}
      </h1>

      <div
        style={{
          fontSize: "1.1rem",
          color: "var(--accent-primary)",
          marginBottom: "1.5rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        coming soon
      </div>

      {description && (
        <div
          style={{
            maxWidth: "400px",
            margin: "0 auto 2rem",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
          }}
        >
          {description}
        </div>
      )}

      <Link href="/" className="btn btn-secondary">
        go back
      </Link>
    </main>
  );
}
