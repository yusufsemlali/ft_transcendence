import Link from "next/link";
import { Page } from "@/components/layout";
import { LEGAL_LINKS } from "@/lib/legal-links";

export default function PrivacyPage() {
  return (
    <Page>
      <div className="glass-card" style={{ padding: "clamp(20px, 4vw, 36px)", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 300 }}>Privacy Policy</h1>
          <a href={LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "10px 16px" }}>
            open source policy
          </a>
        </div>

        <p style={{ marginTop: "14px", color: "var(--text-secondary)" }}>
          This page displays your hosted TermsFeed Privacy Policy.
        </p>
      </div>

      <div className="glass-card" style={{ marginTop: "20px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <iframe
          src={LEGAL_LINKS.privacy}
          title="Privacy Policy"
          style={{ width: "100%", minHeight: "75vh", border: 0, background: "white" }}
        />
      </div>

      <p style={{ marginTop: "14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        If the policy does not render in the frame due to browser security headers,
        <a
          href={LEGAL_LINKS.privacy}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "oklch(0.78 0 0)", textDecoration: "underline" }}
        >
          click me
        </a>
        .
      </p>

      <footer className="footer" style={{ marginTop: "18px" }}>
        <Link href="/terms" className="footer-link">terms of service</Link>
      </footer>
    </Page>
  );
}
