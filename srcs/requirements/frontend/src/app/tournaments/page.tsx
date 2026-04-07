"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/api";
import { PublicTournament } from "@ft-transcendence/contracts";

import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  draft: "outline",
  registration: "success",
  upcoming: "outline",
  ongoing: "destructive",
  completed: "default",
  cancelled: "destructive",
};

type StatusFilter = "all" | "registration" | "upcoming" | "ongoing" | "completed";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<PublicTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const query: any = { page, pageSize: 12 };
      if (search) query.search = search;
      if (statusFilter !== "all") query.status = statusFilter;

      const res = await api.tournaments.getTournaments({ query });
      if (res.status === 200) {
        setTournaments(res.body.tournaments);
        setTotalPages(res.body.totalPages);
        setTotal(res.body.total);
      }
    } catch {
      toast.error("Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "registration", label: "Open" },
    { key: "upcoming", label: "Upcoming" },
    { key: "ongoing", label: "Live" },
    { key: "completed", label: "Ended" },
  ];

  return (
    <Page>
      <Stack gap="xl">
        <Section title="tournaments" icon="emoji_events">
          <Card className="overflow-hidden">
            {/* Search + Filters */}
            <div className="px-5 pt-4 pb-3 space-y-3 border-b border-border/10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search tournaments..."
                  className="input h-11 pl-11 pr-4 w-full rounded-lg bg-muted/30 border border-border/30 focus:border-primary/50 focus:bg-muted/50 text-sm font-mono placeholder:text-muted-foreground/40 transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {statusFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setStatusFilter(f.key); setPage(1); }}
                    className={`px-3.5 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md transition-all ${
                      statusFilter === f.key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <span className="ml-auto text-[10px] font-mono text-muted-foreground/50 tabular-nums">{total} total</span>
              </div>
            </div>

            <CardContent className="p-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-40 w-full rounded-sm" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : tournaments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-20">
                  <span className="material-symbols-outlined text-6xl">emoji_events</span>
                  <span className="text-xs font-mono uppercase tracking-[0.4em]">No tournaments found</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournaments.map((t) => (
                    <a key={t.id} href={`/tournaments/${t.id}`} className="block group">
                      <Card className="overflow-hidden hover:border-primary/30 transition-all h-full">
                        {/* Banner */}
                        <div className="h-36 bg-muted relative overflow-hidden">
                          {t.bannerUrl ? (
                            <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-4xl text-muted-foreground/30">emoji_events</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge variant={(STATUS_COLORS[t.status] || "default") as any}>{t.status}</Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">{t.mode}</span>
                            <span className="text-[10px] font-mono text-muted-foreground/50">·</span>
                            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase">{t.bracketType.replace(/_/g, " ")}</span>
                          </div>
                          <h3 className="font-bold text-foreground text-sm mb-2 group-hover:text-primary transition-colors truncate">{t.name}</h3>
                          {t.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-mono text-muted-foreground/50 uppercase">Prize</div>
                              <div className="text-sm font-mono font-bold text-green-400">{t.prizePool || "—"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-mono text-muted-foreground/50 uppercase">Teams</div>
                              <div className="text-sm font-mono font-bold">{t.minTeamSize}v{t.maxTeamSize}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8 pt-4 border-t border-border/10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md bg-muted/30 border border-border/20 hover:bg-muted/60 disabled:opacity-20 transition-all"
                  >
                    prev
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums px-2">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md bg-muted/30 border border-border/20 hover:bg-muted/60 disabled:opacity-20 transition-all"
                  >
                    next
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </Stack>
    </Page>
  );
}
