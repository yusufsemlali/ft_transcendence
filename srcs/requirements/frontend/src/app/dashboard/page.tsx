"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import api from "@/lib/api/api";
import { User, Friend } from "@ft-transcendence/contracts";

import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [userRes, friendsRes, orgsRes] = await Promise.allSettled([
          api.users.getMe(),
          api.friends.getMyFriends({ query: {} }),
          api.organizations.getOrganizations(),
        ]);

        if (userRes.status === "fulfilled" && userRes.value.status === 200) {
          setUser(userRes.value.body);
        }
        if (friendsRes.status === "fulfilled" && friendsRes.value.status === 200) {
          setFriends(friendsRes.value.body);
        }
        if (orgsRes.status === "fulfilled" && orgsRes.value.status === 200) {
          setOrgs(orgsRes.value.body.data);
        }
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const acceptedFriends = friends.filter((f) => f.status === "accepted");
  const pendingFriends = friends.filter((f) => f.status === "pending");
  const onlineFriends = acceptedFriends.filter((f) => f.isOnline);

  if (loading) {
    return (
      <Page>
        <Stack gap="xl">
          <Section title="dashboard" icon="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Card key={i} size="sm" className="flex flex-col items-center text-center p-6">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </Card>
              ))}
            </div>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-sm" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </Card>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-sm" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </Card>
          </div>
        </Stack>
      </Page>
    );
  }

  return (
    <Page>
      <Stack gap="xl">
        {/* Welcome + Profile Stats */}
        <Section title={`welcome back, ${user?.displayName || user?.username || "player"}`} icon="dashboard">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Level", value: user?.level || 0, color: "text-primary", icon: "military_tech" },
              { label: "ELO Rating", value: user?.eloRating || 0, color: "text-green-400", icon: "trending_up" },
              { label: "XP", value: user?.xp?.toLocaleString() || "0", color: "text-foreground", icon: "stars" },
              { label: "Friends", value: acceptedFriends.length, color: "text-foreground", icon: "group" },
            ].map((stat) => (
              <Card key={stat.label} size="sm" className="flex flex-col items-center text-center group hover:border-primary/30">
                <span className="material-symbols-outlined text-muted-foreground/30 text-lg mb-1">{stat.icon}</span>
                <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
                  {stat.label}
                </div>
                <div className={`text-3xl font-black font-mono tracking-tighter ${stat.color}`}>
                  {stat.value}
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Online Friends */}
          <Section title="online friends" icon="wifi">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {onlineFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 opacity-30">
                    <span className="material-symbols-outlined text-4xl">wifi_off</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest">No friends online</span>
                  </div>
                ) : (
                  onlineFriends.slice(0, 8).map((f) => (
                    <div key={f.friendshipId} className="flex items-center gap-3 py-3 px-6 border-b border-border/10 last:border-0 hover:bg-muted/30 transition-all">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-sm bg-muted overflow-hidden ring-1 ring-border/50">
                          <img src={f.avatar || "/default-avatar.png"} alt={f.username} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background shadow-[0_0_6px_#4ade80]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-foreground text-sm truncate block">{f.displayName || f.username}</span>
                        <span className="text-[10px] font-mono text-muted-foreground/60">@{f.username}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </Section>

          {/* Pending Requests */}
          <Section title="pending requests" icon="pending">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {pendingFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 opacity-30">
                    <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest">No pending requests</span>
                  </div>
                ) : (
                  pendingFriends.slice(0, 8).map((f) => (
                    <div key={f.friendshipId} className="flex items-center gap-3 py-3 px-6 border-b border-border/10 last:border-0 hover:bg-muted/30 transition-all">
                      <div className="w-8 h-8 rounded-sm bg-muted overflow-hidden ring-1 ring-border/50">
                        <img src={f.avatar || "/default-avatar.png"} alt={f.username} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-foreground text-sm truncate block">{f.displayName || f.username}</span>
                        <span className="text-[10px] font-mono text-muted-foreground/60">@{f.username}</span>
                      </div>
                      <Badge variant="outline">pending</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </Section>
        </div>

        {/* My Organizations */}
        <Section title="my organizations" icon="corporate_fare">
          {orgs.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                <span className="material-symbols-outlined text-4xl">domain_disabled</span>
                <span className="text-[10px] font-mono uppercase tracking-widest">No organizations yet</span>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {orgs.slice(0, 6).map((org: any) => (
                <a key={org.id} href={`/organizations/${org.id}`} className="block group">
                  <Card className="p-4 hover:border-primary/30 transition-all h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {org.logoUrl ? (
                          <img src={org.logoUrl} alt={org.name} className="w-full h-full rounded-sm object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-lg">corporate_fare</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">{org.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/60">/{org.slug}</div>
                      </div>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </Section>

        {/* Quick Links */}
        <Section title="quick actions" icon="bolt">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Find Friends", icon: "person_search", href: "/friends" },
              { label: "Browse Tournaments", icon: "emoji_events", href: "/tournaments" },
              { label: "Leaderboard", icon: "leaderboard", href: "/leaderboard" },
              { label: "Settings", icon: "settings", href: "/settings" },
            ].map((link) => (
              <a key={link.label} href={link.href} className="block group">
                <Card className="p-6 flex flex-col items-center text-center gap-2 hover:border-primary/30 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-2xl text-muted-foreground group-hover:text-primary transition-colors">{link.icon}</span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{link.label}</span>
                </Card>
              </a>
            ))}
          </div>
        </Section>
      </Stack>
    </Page>
  );
}
