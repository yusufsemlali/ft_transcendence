import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "404 - Page Not Found",
};

export default function CatchAllNotFound() {
    return (
        <div style={{
            minHeight: "80vh",
            padding: "40px 20px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", textAlign: "center" }} className="animate-fade-in">
                <div 
                  className="text-gradient" 
                  style={{ 
                    fontSize: "120px", 
                    fontWeight: "700", 
                    lineHeight: 0.8,
                    marginBottom: "20px"
                  }}
                >
                    404
                </div>
                
                <h1 style={{
                    fontSize: "36px",
                    fontWeight: "300",
                    letterSpacing: "-1px",
                    margin: "0 0 1rem 0"
                }}>
                    Page Not Found
                </h1>

                <p style={{
                    maxWidth: "500px",
                    margin: "0 auto 2.5rem auto",
                    color: "var(--text-secondary)",
                    fontSize: "1rem",
                    lineHeight: "1.6"
                }}>
                    The content you are looking for has been moved to another dimension or doesn&apos;t exist in this timeline.
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                    <Link href="/" className="btn btn-primary" style={{ padding: "10px 24px" }}>
                        Return to Home
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", marginLeft: "8px" }}>home</span>
                    </Link>
                    <Link href="/tournaments" className="btn btn-secondary" style={{ padding: "10px 24px" }}>
                        Browse Tournaments
                    </Link>
                </div>
            </div>
        </div>
    );
}
