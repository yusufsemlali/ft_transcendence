"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tournament, setTournament] = useState<PublicTournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.tournaments.getTournamentById({ params: { id } });
        if (res.status === 200) {
          setTournament(res.body.data);
        } else {
          toast.error("Tournament not found");
        }
      } catch {
        toast.error("Failed to load tournament");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Page>
        <Stack gap="xl">
          <Section title="loading..." icon="emoji_events">
            <Card className="p-8 space-y-4">
              <Skeleton className="h-48 w-full rounded-sm" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="grid grid-cols-4 gap-4 mt-6">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
            </Card>
          </Section>
        </Stack>
      </Page>
    );
  }

  if (!tournament) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-40">
          <span className="material-symbols-outlined text-6xl">emoji_events</span>
          <span className="text-xs font-mono uppercase tracking-[0.4em]">Tournament not found</span>
          <a href="/tournaments" className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-primary text-primary-foreground hover:bg-primary/80 transition-all mt-4">
            back to tournaments
          </a>
        </div>
      </Page>
    );
  }

  const t = tournament;

  return (
    <Page>
      <Stack gap="xl">
        {/* Header */}
        <Section title={t.name} icon="emoji_events">
          {/* Banner */}
          <Card className="overflow-hidden">
            <div className="h-48 bg-muted relative">
              {t.bannerUrl ? (
                <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <span className="material-symbols-outlined text-6xl text-primary/30">emoji_events</span>
                </div>
              )}
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <Badge variant={(STATUS_COLORS[t.status] || "default") as any}>{t.status}</Badge>
                <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-sm backdrop-blur-sm">
                  {t.bracketType.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <CardContent className="p-6">
              {t.description && (
                <p className="text-sm text-muted-foreground mb-6">{t.description}</p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Mode", value: t.mode.toUpperCase(), color: "text-primary" },
                  { label: "Team Size", value: `${t.minTeamSize}v${t.maxTeamSize}`, color: "text-foreground" },
                  { label: "Participants", value: `${t.minParticipants}–${t.maxParticipants}`, color: "text-foreground" },
                  { label: "Prize Pool", value: t.prizePool || "—", color: "text-green-400" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-4 rounded-sm bg-muted/30">
                    <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{s.label}</div>
                    <div className={`text-xl font-black font-mono tracking-tighter ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Details */}
        <Section title="details" icon="info">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {[
                { label: "Scoring Type", value: t.scoringType },
                { label: "Entry Fee", value: t.entryFee > 0 ? `$${t.entryFee}` : "Free" },
                { label: "Created", value: new Date(t.createdAt).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 px-6 border-b border-border/10 last:border-0">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                  <span className="text-sm font-mono text-foreground">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        {/* Back link */}
        <div className="flex justify-center">
          <a href="/tournaments" className="px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
            back to all tournaments
          </a>
        </div>
      </Stack>
    </Page>
  );
}
