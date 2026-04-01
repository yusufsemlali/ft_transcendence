import Link from "next/link";
import { Page, Section, Stack } from "@/components/layout";

/**
 * AboutPage — first page fully built on the design system.
 *
 * Rules enforced:
 *   ✅ All spacing via Page / Section / Stack
 *   ✅ No raw .section / .section-header classnames
 *   ✅ No inline margin or padding for layout
 *   ✅ Inline styles ONLY for visual concerns (color, opacity, masks)
 */
export default function AboutPage() {
  return (
    <Page>
      {/* --- Mission --- */}
      <Section
        icon="info"
        title="our mission"
        description="tournify is a high-performance tournament management platform designed for the modern competitor. we bridge the gap between casual play and professional esports through automated systems."
      >
        <div className="glass-card about-hero-card">
          <Stack gap="sm">
            <h1 className="hero-title text-gradient about-hero-title">
              elevate your game
            </h1>
            <p className="about-hero-text">
              every pixel and interaction in tournify is tuned to provide the
              most fluid experience for organizers and players alike. our vision
              is to return the focus to gameplay by automating the technicalities.
            </p>
          </Stack>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/about_hero.png"
            alt=""
            className="about-hero-img"
          />
        </div>
      </Section>

      {/* --- Features --- */}
      <Section
        icon="rocket_launch"
        title="platform features"
        description="discover the tools that make tournify the ultimate esports playground."
      >
        <div className="about-features-grid">
          <FeatureCard icon="trophy" title="pro brackets">
            from local 1v1 duels to massive 256-player brackets, our engine
            handles everything automatically.
          </FeatureCard>

          <FeatureCard icon="leaderboard" title="deep analytics">
            track every win, loss, and stat. our ranking system uses advanced
            elo calculations.
          </FeatureCard>

          <FeatureCard icon="hub" title="social hub">
            manage your team, chat with opponents, and find matches without
            checking external tools.
          </FeatureCard>
        </div>
      </Section>

      {/* --- Story --- */}
      <Section icon="history_edu" title="the story">
        <div className="settings-row">
          <div className="settings-main">
            <Stack gap="md">
              <p className="about-body-text">
                tournify was born out of a simple frustration: it shouldn&apos;t
                be this hard to organize a competitive tournament.
              </p>
              <p className="about-body-text">
                today, we&apos;re more than just a bracket generator. we&apos;re
                a hub for the next generation of esports athletes to prove their
                skill.
              </p>
            </Stack>
          </div>
          <div className="settings-side about-version-side">
            <div className="glass-card about-version-card">
              <span className="material-symbols-outlined about-version-icon">
                sports_esports
              </span>
              <span className="about-version-label">v0.1.0-alpha.prism</span>
            </div>
          </div>
        </div>
      </Section>

      {/* --- CTA --- */}
      <Section icon="arrow_forward" title="get involved">
        <div className="glass-card about-cta-card">
          <Stack gap="lg">
            <h2 className="about-cta-title">ready to step into the arena?</h2>
            <p className="about-body-text about-cta-text">
              join thousands of players already competing on the most advanced
              platform.
            </p>
            <div className="about-cta-actions">
              <Link href="/auth/register" className="btn btn-primary about-cta-btn">
                get started
              </Link>
              <Link href="/tournaments" className="btn btn-secondary about-cta-btn">
                browse events
              </Link>
            </div>
          </Stack>
        </div>
      </Section>
    </Page>
  );
}

/* ── Local sub-component (not exported) ── */
function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card about-feature-card">
      <Stack gap="sm">
        <span className="material-symbols-outlined about-feature-icon">
          {icon}
        </span>
        <h3 className="about-feature-title">{title}</h3>
        <p className="about-feature-text">{children}</p>
      </Stack>
    </div>
  );
}
