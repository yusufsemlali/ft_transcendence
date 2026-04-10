import Link from "next/link";
import { Page } from "@/components/layout";
import { LEGAL_LINKS } from "@/lib/legal-links";

export default function TermsPage() {
  return (
    <Page>
      <div className="glass-card" style={{ padding: "clamp(20px, 4vw, 36px)", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 300 }}>Terms of Service</h1>
          {LEGAL_LINKS.terms && (
            <a href={LEGAL_LINKS.terms} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "10px 16px" }}>
              open source terms
            </a>
          )}
        </div>

        <p style={{ marginTop: "14px", color: "var(--text-secondary)" }}>
          These Terms of Service govern your use of Tournify.
        </p>
      </div>

      <div className="glass-card" style={{ marginTop: "20px", border: "1px solid var(--border-color)", padding: "clamp(20px, 4vw, 36px)", display: "grid", gap: "22px" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>1. Eligibility and Accounts</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            You must be legally able to enter into contracts to use this service. You are responsible for all activity on your account and maintaining account security.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>2. Acceptable Use</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            You agree not to misuse the platform, interfere with tournaments, attempt unauthorized access, or violate applicable laws.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>3. User Content</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            You retain ownership of content you submit. By posting, you grant us a limited license to host and display it for platform operation and improvement.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>4. Service Availability</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            We may modify, suspend, or discontinue features at any time for maintenance, security, or platform improvements.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>5. Termination</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            We may suspend or terminate accounts that violate these Terms or pose risk to users or the platform.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>6. Disclaimer</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            The service is provided "as is". We disclaim implied warranties and limit liability for indirect or consequential damages to the maximum extent permitted by law.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>7. Contact</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            For legal questions, contact <strong>+212 607-162986</strong>.
          </p>
        </div>
      </div>

      <footer className="footer" style={{ marginTop: "18px" }}>
        <Link href="/privacy" className="footer-link">privacy policy</Link>
      </footer>
    </Page>
  );
}
