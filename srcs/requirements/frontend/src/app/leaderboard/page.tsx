"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import api from "@/lib/api/api";
import { User } from "@ft-transcendence/contracts";

import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type SortBy = "eloRating" | "level" | "xp";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("eloRating");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.admin.getUsers({ query: { page: 1, pageSize: 50 } });
        if (res.status === 200) {
          setUsers(res.body.users);
        } else {
          const res2 = await api.users.searchUsers({ query: { q: "a", limit: 20 } });
          if (res2.status === 200) setUsers(res2.body);
        }
      } catch {
        try {
          const res = await api.users.searchUsers({ query: { q: "a", limit: 20 } });
          if (res.status === 200) setUsers(res.body);
        } catch {
          toast.error("Failed to load leaderboard");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = [...users].sort((a, b) => {
    if (sortBy === "eloRating") return b.eloRating - a.eloRating;
    if (sortBy === "level") return b.level - a.level;
    return b.xp - a.xp;
  });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const sortOptions: { key: SortBy; label: string }[] = [
    { key: "eloRating", label: "ELO" },
    { key: "level", label: "Level" },
    { key: "xp", label: "XP" },
  ];

  return (
    <Page>
      <Stack gap="xl">
        <Section title="global rankings" icon="leaderboard"
          actions={
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mr-1">Sort:</span>
              {sortOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSortBy(o.key)}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all ${
                    sortBy === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          }
        >
          {/* Podium */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i} className="p-8">
                  <div className="flex flex-col items-center gap-3">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </Card>
              ))}
            </div>
          ) : top3.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {[1, 0, 2].map((idx) => {
                const player = top3[idx];
                if (!player) return null;
                const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                const isChamp = rank === 1;
                return (
                  <Card
                    key={player.id}
                    className={`p-6 text-center relative overflow-hidden ${isChamp ? "border-primary/50 md:scale-105" : ""}`}
                  >
                    {isChamp && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive">CHAMPION</Badge>
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <div className={`${isChamp ? "w-20 h-20" : "w-14 h-14"} rounded-full bg-muted overflow-hidden ring-2 ${isChamp ? "ring-primary" : "ring-border/50"} mb-3`}>
                        <img src={player.avatar || "/default-avatar.png"} alt={player.username} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                        RANK #{rank}
                      </div>
                      <div className={`font-bold ${isChamp ? "text-lg" : "text-sm"} text-foreground mb-3`}>
                        {player.displayName || player.username}
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-[10px] font-mono text-muted-foreground/50 uppercase">ELO</div>
                          <div className="text-lg font-black font-mono text-green-400">{player.eloRating}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-muted-foreground/50 uppercase">LVL</div>
                          <div className="text-lg font-black font-mono text-foreground">{player.level}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-muted-foreground/50 uppercase">XP</div>
                          <div className="text-lg font-black font-mono text-primary">{player.xp.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                <span className="material-symbols-outlined text-6xl">leaderboard</span>
                <span className="text-xs font-mono uppercase tracking-[0.4em]">No players yet</span>
              </div>
            </Card>
          )}
        </Section>

        {/* Full Rankings Table */}
        {rest.length > 0 && (
          <Section title="full rankings" icon="format_list_numbered">
            <Card className="overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[60px_1fr_100px_80px_100px] gap-4 px-6 py-3 border-b border-border/10">
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Rank</span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Player</span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-right">ELO</span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-right">Level</span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-right">XP</span>
              </div>
              <CardContent className="p-0">
                {rest.map((player, i) => (
                  <div key={player.id} className="grid grid-cols-[60px_1fr_100px_80px_100px] gap-4 items-center px-6 py-3 border-b border-border/10 last:border-0 hover:bg-muted/30 transition-all">
                    <span className="text-sm font-mono font-bold text-muted-foreground/50">#{i + 4}</span>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-sm bg-muted overflow-hidden ring-1 ring-border/50">
                          <img src={player.avatar || "/default-avatar.png"} alt={player.username} className="w-full h-full object-cover" />
                        </div>
                        {player.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-sm truncate">{player.displayName || player.username}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/60">@{player.username}</div>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-green-400 text-right">{player.eloRating}</span>
                    <span className="text-sm font-mono text-foreground text-right">{player.level}</span>
                    <span className="text-sm font-mono text-muted-foreground text-right">{player.xp.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Section>
        )}
      </Stack>
    </Page>
  );
}
