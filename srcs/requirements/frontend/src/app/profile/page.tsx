"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api/api";
import {
  User,
  Sport,
  Handle,
  Friend,
  Organization,
  LinkedAccount,
} from "@ft-transcendence/contracts";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Link from "next/link";

/* ─────────────────────────────────────────────────────
   Utilities
   ───────────────────────────────────────────────────── */

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function xpToNextLevel(level: number, xp: number): number {
  const required = level * 100;
  return Math.min(100, Math.floor((xp % required) / required * 100));
}

function getRankColor(elo: number): string {
  if (elo >= 2400) return "#e8d44d";   // Gold
  if (elo >= 2000) return "#c0c0c0";   // Silver
  if (elo >= 1600) return "#cd7f32";   // Bronze
  if (elo >= 1200) return "#88c0d0";   // Iron
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

const PROVIDER_META: Record<string, { label: string; icon: string; color: string }> = {
  "42": { label: "42 Intra", icon: "school", color: "#00babc" },
  discord: { label: "Discord", icon: "headset_mic", color: "#5865f2" },
  google: { label: "Google", icon: "mail", color: "#ea4335" },
  github: { label: "GitHub", icon: "code", color: "#8b949e" },
};

/* ─────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────── */

function ProfileBanner({
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
    <div className="relative w-full group">
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
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Grid pattern overlay */}
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

          {/* Online indicator */}
          {user?.isOnline && (
            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 ring-2 ring-background shadow-[0_0_12px_#4ade80]" />
          )}

          {/* Level badge on avatar */}
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

      {/* Edit banner button (links to settings) */}
      <Link
        href="/settings"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/60 backdrop-blur-sm rounded-full p-2 hover:bg-background/80"
      >
        <span className="material-symbols-outlined text-sm text-muted-foreground">
          edit
        </span>
      </Link>
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
      {/* Subtle glow */}
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

function FriendBubble({ friend }: { friend: Friend }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="relative group/friend" title={friend.displayName || friend.username}>
      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted ring-2 ring-background transition-transform duration-200 group-hover/friend:scale-110 group-hover/friend:ring-primary/50">
        {friend.avatar && !imgErr ? (
          <img
            src={friend.avatar}
            alt={friend.username}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-muted-foreground/40">
              person
            </span>
          </div>
        )}
      </div>
      {friend.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-1.5 ring-background" />
      )}
    </div>
  );
}

function OrgCard({ org }: { org: Organization }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-primary/30 transition-all group/org cursor-default">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {org.logoUrl && !imgErr ? (
          <img
            src={org.logoUrl}
            alt={org.name}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-lg text-muted-foreground/40 group-hover/org:text-primary/60 transition-colors">
            shield
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">
          {org.name}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground truncate">
          /{org.slug}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Link Account Modal
   ───────────────────────────────────────────────────── */

function LinkAccountModal({
  isOpen,
  onClose,
  sports,
  selectedSportId,
  setSelectedSportId,
  identifier,
  setIdentifier,
  submitting,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  sports: Sport[];
  selectedSportId: string;
  setSelectedSportId: (id: string) => void;
  identifier: string;
  setIdentifier: (val: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="max-w-md w-full shadow-2xl relative border-primary/20 p-0 overflow-hidden">
        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>

          <div className="mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
              Link Platform
            </h3>
            <p className="text-xs font-mono text-muted-foreground mt-2 leading-relaxed">
              Connect your game identity to enable cross-platform tracking.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                Platform
              </label>
              <Select
                value={selectedSportId}
                onValueChange={setSelectedSportId}
              >
                <SelectTrigger className="capitalize h-10 border border-border/50 focus:border-primary/50">
                  <SelectValue placeholder="Select Platform...">
                    {selectedSportId &&
                      (() => {
                        const s = sports.find(
                          (sp: Sport) => sp.id === selectedSportId
                        );
                        return s?.name ?? null;
                      })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport: Sport) => (
                    <SelectItem
                      key={sport.id}
                      value={sport.id}
                      className="capitalize"
                    >
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                Game ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. FAKER#KR1"
                className="input h-10 border border-border/50 focus:border-primary/50 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !identifier}
              className="btn btn-primary w-full justify-center py-3 text-xs font-bold uppercase tracking-widest shadow-xl disabled:opacity-50"
            >
              {submitting ? "Linking..." : "Link Account"}
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main Profile Page
   ───────────────────────────────────────────────────── */

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [handles, setHandles] = useState<Handle[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSportId, setSelectedSportId] = useState<string>("");
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [userRes, handlesRes, sportsRes, friendsRes, orgsRes, identitiesRes] =
          await Promise.all([
            api.users.getMe(),
            api.handles.getMyHandles({}),
            api.sports.getSports({}),
            api.friends.getMyFriends({}),
            api.organizations.getOrganizations(),
            api.handles.getIdentities(),
          ]);

        if (!isMounted) return;

        if (userRes.status === 200) setUser(userRes.body);
        if (handlesRes.status === 200) setHandles(handlesRes.body);
        if (sportsRes.status === 200) {
          setSports(sportsRes.body);
          if (sportsRes.body.length > 0)
            setSelectedSportId(sportsRes.body[0].id);
        }
        if (friendsRes.status === 200) setFriends(friendsRes.body);
        if (orgsRes.status === 200) setOrgs(orgsRes.body.data);
        if (identitiesRes.status === 200)
          setLinkedAccounts(identitiesRes.body);
      } catch (err) {
        if (!isMounted) return;
        console.error("Profile load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSportId) return;

    setSubmitting(true);
    try {
      const res = await api.handles.create({
        body: { sportId: selectedSportId, handle: identifier },
      });

      if (res.status === 201) {
        setHandles([...handles, res.body]);
        setIsAddModalOpen(false);
        setIdentifier("");
        const sport = sports.find((s: Sport) => s.id === selectedSportId);
        toast.success(`Linked ${sport?.name || "Game Account"}`);
      } else {
        const errorBody = res.body as { message: string };
        toast.error(`Error: ${errorBody.message}`);
      }
    } catch {
      toast.error("Failed to link account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async (handleId: string, handleName: string) => {
    if (!confirm(`Unlink ${handleName}?`)) return;
    try {
      const res = await api.handles.delete({
        params: { id: handleId },
      });
      if (res.status === 204) {
        setHandles(handles.filter((h) => h.id !== handleId));
        toast.success("Unlinked successfully");
      }
    } catch {
      toast.error("Failed to unlink account");
    }
  };

  // Derived data
  const acceptedFriends = useMemo(
    () => friends.filter((f) => f.status === "accepted"),
    [friends]
  );
  const onlineFriends = useMemo(
    () => acceptedFriends.filter((f) => f.isOnline),
    [acceptedFriends]
  );
  const xpProgress = user ? xpToNextLevel(user.level, user.xp) : 0;

  return (
    <Page>
      <Stack gap="xl">
        {/* ─── Hero Banner ─── */}
        <div>
          <ProfileBanner user={user} loading={loading} />

          {/* Name & Info row (below avatar) */}
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

                    {user?.displayName && user.displayName !== user.username && (
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
                      Member since {user?.createdAt ? formatDate(user.createdAt) : "—"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!loading && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/settings"
                    className="btn btn-secondary text-xs gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      settings
                    </span>
                    Settings
                  </Link>
                  <Link
                    href="/account-settings"
                    className="btn btn-ghost text-xs gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                    Edit Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bio Section ─── */}
        {!loading && user?.bio && (
          <Section title="about" icon="info">
            <Card size="sm">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {user.bio}
              </p>
            </Card>
          </Section>
        )}

        {/* ─── Stats Grid ─── */}
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
              label="Friends"
              value={acceptedFriends.length}
              icon="group"
              accent="#8b5cf6"
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

        {/* ─── Two-Column: Friends + Organizations ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Friends */}
          <Section title="friends" icon="group">
            <Card className="min-h-[160px]">
              <CardContent>
                {loading ? (
                  <div className="flex gap-3">
                    {Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="w-10 h-10 rounded-full" />
                      ))}
                  </div>
                ) : acceptedFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <span className="material-symbols-outlined text-3xl text-muted-foreground/20">
                      group_off
                    </span>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      No friends yet
                    </p>
                    <Link
                      href="/friends"
                      className="btn btn-secondary text-[10px]"
                    >
                      Find Friends
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Online count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_#4ade80]" />
                        <span className="text-xs font-mono text-muted-foreground">
                          {onlineFriends.length} online
                        </span>
                      </div>
                      <Link
                        href="/friends"
                        className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                      >
                        View All →
                      </Link>
                    </div>

                    {/* Avatar row */}
                    <div className="flex flex-wrap gap-2">
                      {acceptedFriends.slice(0, 12).map((f) => (
                        <FriendBubble key={f.friendshipId} friend={f} />
                      ))}
                      {acceptedFriends.length > 12 && (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground ring-2 ring-background">
                          +{acceptedFriends.length - 12}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Section>

          {/* Organizations */}
          <Section title="organizations" icon="shield">
            <Card className="min-h-[160px]">
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array(2)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                      ))}
                  </div>
                ) : orgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <span className="material-symbols-outlined text-3xl text-muted-foreground/20">
                      shield
                    </span>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      No organizations
                    </p>
                    <Link
                      href="/dashboard"
                      className="btn btn-secondary text-[10px]"
                    >
                      Create or Join
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orgs.slice(0, 4).map((org) => (
                      <OrgCard key={org.id} org={org} />
                    ))}
                    {orgs.length > 4 && (
                      <div className="text-center pt-2">
                        <Link
                          href="/dashboard"
                          className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                        >
                          +{orgs.length - 4} more →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Section>
        </div>

        {/* ─── Two-Column: Game Handles + Linked Accounts ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Handles */}
          <Section
            title="game handles"
            icon="sports_esports"
            actions={
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            }
          >
            <Card className="min-h-[160px]">
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array(2)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                      ))}
                  </div>
                ) : handles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <span className="material-symbols-outlined text-3xl text-muted-foreground/20">
                      link_off
                    </span>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">
                      No game accounts linked
                    </p>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-secondary text-[10px]"
                    >
                      Link Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {handles.map((h: Handle) => {
                      const sport = sports.find(
                        (s: Sport) => s.id === h.sportId
                      );
                      return (
                        <div
                          key={h.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-primary/30 transition-all group/handle"
                        >
                          <div className="flex items-center gap-3 min-w-0">
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
                          <button
                            onClick={() => handleUnlink(h.id, h.handle)}
                            className="opacity-0 group-hover/handle:opacity-100 transition-opacity text-muted-foreground hover:text-destructive-foreground"
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        </div>
                      );
                    })}

                    {/* Add more button */}
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary w-full"
                    >
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest">
                        Add Platform
                      </span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </Section>

          {/* Linked Accounts (Social/Auth) */}
          <Section title="linked accounts" icon="key">
            <Card className="min-h-[160px]">
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array(2)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                      ))}
                  </div>
                ) : linkedAccounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <span className="material-symbols-outlined text-3xl text-muted-foreground/20">
                      lock_open
                    </span>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">
                      No external accounts connected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedAccounts.map((acc) => {
                      const meta =
                        PROVIDER_META[acc.provider.toLowerCase()] ||
                        PROVIDER_META["github"];
                      return (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                              }}
                            >
                              <span
                                className="material-symbols-outlined text-lg"
                                style={{ color: meta.color }}
                              >
                                {meta.icon}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-foreground">
                                {meta.label}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground truncate">
                                ID: {acc.providerId}
                              </div>
                            </div>
                          </div>
                          <Badge variant="success" className="flex-shrink-0">
                            Connected
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </Section>
        </div>

        {/* ─── Elo Rank Visual ─── */}
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

                  {/* Decorative ring */}
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

              {/* Background glow */}
              <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
                style={{ background: getRankColor(user.eloRating) }}
              />
            </Card>
          </Section>
        )}

        {/* ─── Account Info Footer ─── */}
        {!loading && user && (
          <Section title="account details" icon="manage_accounts">
            <Card size="sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Email
                  </div>
                  <div className="text-sm text-foreground font-mono truncate">
                    {user.email}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Role
                  </div>
                  <div className="text-sm text-foreground capitalize">
                    {user.role}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Language
                  </div>
                  <div className="text-sm text-foreground uppercase">
                    {user.preferredLanguage}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Theme
                  </div>
                  <div className="text-sm text-foreground capitalize">
                    {user.theme || "Default"}
                  </div>
                </div>
              </div>
            </Card>
          </Section>
        )}
      </Stack>

      {/* ─── Link Account Modal ─── */}
      <LinkAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        sports={sports}
        selectedSportId={selectedSportId}
        setSelectedSportId={setSelectedSportId}
        identifier={identifier}
        setIdentifier={setIdentifier}
        submitting={submitting}
        onSubmit={handleLinkAccount}
      />
    </Page>
  );
}
