"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api/api";
import {
  User,
  Sport,
  Handle,
} from "@ft-transcendence/contracts";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* ─────────────────────────────────────────────────────
   Utilities
   ───────────────────────────────────────────────────── */

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function xpToNextLevel(level: number, xp: number): number {
  const required = level * 100;
  return Math.min(100, Math.floor(((xp % required) / required) * 100));
}

function getRankColor(elo: number): string {
  if (elo >= 2400) return "#e8d44d";
  if (elo >= 2000) return "#c0c0c0";
  if (elo >= 1600) return "#cd7f32";
  if (elo >= 1200) return "#88c0d0";
  return "var(--muted-foreground)";
}

function getRankLabel(elo: number): string {
  if (elo >= 2400) return "GRANDMASTER";
  if (elo >= 2000) return "DIAMOND";
  if (elo >= 1600) return "PLATINUM";
  if (elo >= 1200) return "GOLD";
  if (elo >= 800) return "SILVER";
  return "UNRANKED";
}

/* ─────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────── */

function PublicBanner({
  user,
  loading,
}: {
  user: User | null;
  loading: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  if (loading) {
    return (
      <div className="relative w-full">
        <Skeleton className="w-full h-48 sm:h-64 rounded-lg" />
        <div className="absolute -bottom-12 left-6 sm:left-10">
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full" />
        </div>
      </div>
    );
  }

  const hasBanner = user?.banner && !bannerError;
  const hasAvatar = user?.avatar && !imgError;

  return (
    <div className="relative w-full">
      {/* Banner */}
      <div
        className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden"
        style={{
          background: hasBanner
            ? "transparent"
            : "linear-gradient(135deg, color-mix(in srgb, var(--primary) 30%, transparent) 0%, color-mix(in srgb, var(--primary) 5%, transparent) 100%)",
        }}
      >
        {hasBanner && (
          <img
            src={user.banner!}
            alt="Profile banner"
            onError={() => setBannerError(true)}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.03]" />
      </div>

      {/* Avatar */}
      <div className="absolute -bottom-14 left-6 sm:left-10">
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-background overflow-hidden bg-muted shadow-2xl">
            {hasAvatar ? (
              <img
                src={user.avatar!}
                alt={user?.username || "User avatar"}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-muted-foreground/40">
                  person
                </span>
              </div>
            )}
          </div>

          {user?.isOnline && (
            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 ring-2 ring-background shadow-[0_0_12px_#4ade80]" />
          )}

          <div
            className="absolute -top-1 -right-1 min-w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-mono font-black shadow-lg"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {user?.level || 1}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: string;
  loading: boolean;
}) {
  return (
    <Card
      size="sm"
      className="group hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
    >
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl"
        style={{ background: accent || "var(--primary)" }}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">
            {label}
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div
              className="text-2xl sm:text-3xl font-black font-mono tracking-tighter"
              style={{ color: accent || "var(--foreground)" }}
            >
              {value}
            </div>
          )}
        </div>
        <span
          className="material-symbols-outlined text-lg opacity-20 group-hover:opacity-40 transition-opacity"
          style={{ color: accent || "var(--muted-foreground)" }}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────
   Public Profile Page
   ───────────────────────────────────────────────────── */

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [handles, setHandles] = useState<Handle[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const loadData = async () => {
      try {
        const [userRes, handlesRes, sportsRes] = await Promise.all([
          api.users.getUserById({ params: { id: userId } }),
          api.handles.getUserHandles({ params: { userId } }),
          api.sports.getSports({}),
        ]);

        if (!isMounted) return;

        if (userRes.status === 200) {
          setUser(userRes.body);
        } else {
          setNotFound(true);
        }
        if (handlesRes.status === 200) setHandles(handlesRes.body);
        if (sportsRes.status === 200) setSports(sportsRes.body);
      } catch (err) {
        if (!isMounted) return;
        console.error("Profile load error:", err);
        setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const xpProgress = user ? xpToNextLevel(user.level, user.xp) : 0;

  // Not found state
  if (!loading && notFound) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <span className="material-symbols-outlined text-6xl text-muted-foreground/20">
            person_off
          </span>
          <h1 className="text-2xl font-bold text-foreground">
            Player Not Found
          </h1>
          <p className="text-sm text-muted-foreground">
            This profile doesn&apos;t exist or has been removed.
          </p>
          <Link href="/" className="btn btn-secondary text-xs">
            ← Back to Home
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Stack gap="xl">
        {/* ─── Hero Banner ─── */}
        <div>
          <PublicBanner user={user} loading={loading} />

          <div className="mt-16 sm:mt-18 px-2">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-2">
                {loading ? (
                  <Skeleton className="h-10 w-64" />
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                        {user?.displayName || user?.username}
                      </h1>
                      <Badge variant="outline" className="h-5 px-2">
                        {getRankLabel(user?.eloRating || 1000)}
                      </Badge>
                      {user?.role !== "user" && (
                        <Badge variant="default" className="h-5 px-2">
                          {user?.role?.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    {user?.displayName &&
                      user.displayName !== user.username && (
                        <div className="text-sm font-mono text-muted-foreground">
                          @{user.username}
                        </div>
                      )}
                  </>
                )}

                {/* Tagline */}
                {!loading && user?.tagline && (
                  <p className="text-sm text-muted-foreground italic max-w-md">
                    &ldquo;{user.tagline}&rdquo;
                  </p>
                )}

                {/* Status chips */}
                {!loading && (
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          user?.isOnline
                            ? "bg-green-500 shadow-[0_0_8px_#4ade80]"
                            : "bg-muted-foreground/30"
                        )}
                      />
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                        {user?.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>

                    <span className="text-border">•</span>

                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      Member since{" "}
                      {user?.createdAt ? formatDate(user.createdAt) : "—"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!loading && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/friends"
                    className="btn btn-primary text-xs gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      person_add
                    </span>
                    Add Friend
                  </Link>
                  <Link
                    href={`/chat`}
                    className="btn btn-secondary text-xs gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chat
                    </span>
                    Message
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bio ─── */}
        {!loading && user?.bio && (
          <Section title="about" icon="info">
            <Card size="sm">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {user.bio}
              </p>
            </Card>
          </Section>
        )}

        {/* ─── Stats ─── */}
        <Section title="statistics" icon="bar_chart">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Level"
              value={user?.level || 1}
              icon="star"
              accent="var(--primary)"
              loading={loading}
            />
            <StatCard
              label="Experience"
              value={user ? `${user.xp.toLocaleString()} XP` : "0"}
              icon="bolt"
              accent="#f59e0b"
              loading={loading}
            />
            <StatCard
              label="Elo Rating"
              value={user?.eloRating || 1000}
              icon="leaderboard"
              accent={getRankColor(user?.eloRating || 1000)}
              loading={loading}
            />
            <StatCard
              label="Rank"
              value={getRankLabel(user?.eloRating || 1000)}
              icon="military_tech"
              accent={getRankColor(user?.eloRating || 1000)}
              loading={loading}
            />
          </div>

          {/* XP Progress bar */}
          {!loading && user && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                  Progress to Level {user.level + 1}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {xpProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${xpProgress}%`,
                    background: "var(--gradient-prism)",
                  }}
                />
              </div>
            </div>
          )}
        </Section>

        {/* ─── Game Handles ─── */}
        {!loading && handles.length > 0 && (
          <Section title="game handles" icon="sports_esports">
            <Card>
              <CardContent>
                <div className="space-y-2">
                  {handles.map((h: Handle) => {
                    const sport = sports.find(
                      (s: Sport) => s.id === h.sportId
                    );
                    return (
                      <div
                        key={h.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-black text-primary/60">
                            {sport?.name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {h.handle}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground uppercase">
                            {sport?.name || "Unknown Platform"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* ─── Rank Overview ─── */}
        {!loading && user && (
          <Section title="rank overview" icon="military_tech">
            <Card className="overflow-hidden relative">
              <div className="flex flex-col sm:flex-row items-center gap-8 relative">
                {/* Rank emblem */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center relative"
                    style={{
                      background: `radial-gradient(circle, color-mix(in srgb, ${getRankColor(user.eloRating)} 20%, transparent) 0%, transparent 70%)`,
                      border: `2px solid color-mix(in srgb, ${getRankColor(user.eloRating)} 40%, transparent)`,
                    }}
                  >
                    <div className="text-center">
                      <span
                        className="material-symbols-outlined text-4xl"
                        style={{ color: getRankColor(user.eloRating) }}
                      >
                        military_tech
                      </span>
                      <div
                        className="text-[10px] font-mono font-black uppercase tracking-widest mt-1"
                        style={{ color: getRankColor(user.eloRating) }}
                      >
                        {getRankLabel(user.eloRating)}
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 rounded-full animate-pulse opacity-20"
                    style={{
                      boxShadow: `0 0 40px ${getRankColor(user.eloRating)}`,
                    }}
                  />
                </div>

                {/* Rank details */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">
                    Competitive Rating
                  </div>
                  <div
                    className="text-5xl sm:text-6xl font-black font-mono tracking-tighter"
                    style={{ color: getRankColor(user.eloRating) }}
                  >
                    {user.eloRating}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-2">
                    {user.eloRating >= 1200
                      ? `${user.eloRating - 1000} points above baseline`
                      : "Keep playing to improve your rating"}
                  </div>

                  {/* Rank tier visual scale */}
                  <div className="mt-4 flex items-center gap-1">
                    {[
                      { label: "S", min: 0, color: "#666" },
                      { label: "G", min: 800, color: "#c0c0c0" },
                      { label: "P", min: 1200, color: "#cd7f32" },
                      { label: "D", min: 1600, color: "#88c0d0" },
                      { label: "GM", min: 2000, color: "#bd93f9" },
                      { label: "★", min: 2400, color: "#e8d44d" },
                    ].map((tier) => (
                      <div
                        key={tier.label}
                        className="flex-1 h-1.5 rounded-full transition-all"
                        style={{
                          background:
                            user.eloRating >= tier.min
                              ? tier.color
                              : "var(--muted)",
                          opacity: user.eloRating >= tier.min ? 1 : 0.3,
                        }}
                        title={`${tier.label}: ${tier.min} ELO`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[8px] font-mono text-muted-foreground/40">
                      0
                    </span>
                    <span className="text-[8px] font-mono text-muted-foreground/40">
                      2400+
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
                style={{ background: getRankColor(user.eloRating) }}
              />
            </Card>
          </Section>
        )}
      </Stack>
    </Page>
  );
}
