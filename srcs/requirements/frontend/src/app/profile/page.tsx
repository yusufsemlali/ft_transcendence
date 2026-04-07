"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import api from "@/lib/api/api";
import {
  User,
  Sport,
  Handle,
} from "@ft-transcendence/contracts";
import { toast } from "@/components/ui/sonner";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

function HexAvatar({
  src,
  alt,
  isOnline,
  loading = false,
}: {
  src?: string | null;
  alt?: string;
  isOnline?: boolean;
  loading?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  if (loading) {
    return (
      <div className="relative w-40 h-48 sm:w-48 sm:h-56">
        <Skeleton
          className="w-full h-full"
          style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)" }}
        />
      </div>
    );
  }

  // Use a fallback if src is missing or image fails to load
  const showFallback = !src || imgError;

  return (
    <div className="relative w-40 h-48 sm:w-48 sm:h-56 group transition-transform duration-500 hover:scale-[1.02]">
      {/* The Glow */}
      <div
        className="absolute inset-0 bg-primary opacity-10 blur-2xl rounded-3xl group-hover:opacity-20 transition-opacity"
        style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)" }}
      />

      {/* Actual Avatar */}
      <div
        className="absolute inset-0 bg-card ring-1 ring-border shadow-2xl overflow-hidden"
        style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)" }}
      >
        {showFallback ? (
           <div className="w-full h-full flex items-center justify-center bg-muted">
             <span className="material-symbols-outlined text-4xl text-muted-foreground/30">person</span>
           </div>
        ) : (
          <img
            src={src}
            alt={alt || "User avatar"}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}

        {/* Online Indicator */}
        {isOnline && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_12px_#4ade80]" />
            <Badge variant="success" className="px-1 py-0 h-3 text-[8px]">ONLINE</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function StatModule({
  label,
  value,
  subtext,
  loading = false,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  loading?: boolean;
}) {
  return (
    <Card size="sm" className="flex flex-col items-center text-center group hover:border-primary/30">
      <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16 my-1" />
      ) : (
        <div className="text-3xl font-black text-foreground font-mono tracking-tighter">
          {value}
        </div>
      )}
      {subtext && (
        <div className="text-[10px] text-muted-foreground/60 font-mono italic uppercase tracking-tighter mt-1">
          {subtext}
        </div>
      )}
    </Card>
  );
}

interface MatchRowProps {
  opponent: string;
  result: string;
  score: string;
  kda: string;
  map: string;
  date: string;
}

function MatchRow({ opponent, result, score, kda, map, date }: MatchRowProps) {
  const isWin = result === "Win";
  return (
    <div className="grid grid-cols-7 items-center py-4 border-b border-border/10 text-sm hover:bg-muted/30 transition-all px-6 group last:border-0 grow">
      <div className="font-bold text-foreground flex items-center gap-3 col-span-2">
        <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center">
          <span className="material-symbols-outlined text-sm text-muted-foreground">person</span>
        </div>
        <span className="truncate">{opponent}</span>
      </div>

      <div>
        <Badge variant={isWin ? "success" : "destructive"}>
          {result}
        </Badge>
      </div>

      <div className="font-mono text-muted-foreground font-medium">{score}</div>
      <div className="font-mono text-muted-foreground font-medium">{kda}</div>
      <div className="text-muted-foreground/80 font-mono text-xs uppercase tracking-wider">{map}</div>
      <div className="text-muted-foreground/40 text-[10px] text-right font-mono italic">
        {date}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [handles, setHandles] = useState<Handle[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSportId, setSelectedSportId] = useState<string>("");
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [userRes, handlesRes, sportsRes] = await Promise.all([
          api.users.getMe(),
          api.handles.getMyHandles({}),
          api.sports.getSports({}),
        ]);

        if (!isMounted) return;

        if (userRes.status === 200) setUser(userRes.body);
        if (handlesRes.status === 200) setHandles(handlesRes.body);
        if (sportsRes.status === 200) {
          setSports(sportsRes.body);
          if (sportsRes.body.length > 0) setSelectedSportId(sportsRes.body[0].id);
        }

      } catch (err) {
        if (!isMounted) return;
        console.error("Profile load error:", err);
        // Special case for 401: ts-rest-adapter already handles redirection
        // Only toast if it's not an auth error to avoid noise
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

  return (
    <Page>
      <Stack gap="xl">
        {/* --- Section 1: Header Dashboard --- */}
        <Section title="player profile" icon="person">
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Avatar Cluster (Span 3) */}
            <div className="col-span-12 lg:col-span-3 flex justify-center lg:justify-start">
              <HexAvatar
                src={user?.avatar}
                alt={user?.username}
                isOnline={true}
                loading={loading}
              />
            </div>

            {/* Info & Stats Cluster (Span 9) */}
            <div className="col-span-12 lg:col-span-9">
              <Stack gap="lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border/10 pb-8 gap-6">
                  <div className="space-y-4">
                    {loading ? (
                      <Skeleton className="h-12 w-64" />
                    ) : (
                      <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground flex items-center gap-4">
                        {user?.displayName || user?.username}
                        <Badge variant="outline" className="h-6 px-3">{user?.level ? `LVL ${user.level}` : "..."}</Badge>
                      </h1>
                    )}

                    <div className="flex flex-wrap gap-6 items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                        <span className="text-[10px] font-mono font-bold text-foreground uppercase tracking-widest leading-none">STATUS: ACTIVE</span>
                      </div>

                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-[10px] font-mono font-bold text-muted-foreground hover:text-primary transition-colors border-b border-dashed border-border py-0.5"
                      >
                        + CONNECT_PLATFORM
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-right">Team Identity</div>
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border/50">
                      <span className="material-symbols-outlined text-muted-foreground/30">shield</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatModule label="Career Matches" value="5" subtext="Global" loading={loading} />
                  <StatModule label="Tournaments" value="0" subtext="Active" loading={loading} />
                  <StatModule label="Win Ratio" value="--" subtext="Standardized" loading={loading} />
                  <StatModule label="Integrity" value="100%" subtext="Trusted" loading={loading} />
                </div>
              </Stack>
            </div>
          </div>
        </Section>

        {/* --- Section 2: Core Metrics --- */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content (Span 8) */}
          <div className="col-span-12 lg:col-span-8">
            <Section title="performance index" icon="monitoring">
              <Card className="min-h-[400px] flex flex-col relative overflow-hidden">
                <CardHeader className="flex-row justify-between items-center space-y-0">
                  <CardDescription className="font-mono uppercase tracking-[0.15em]">Elo projection (last 30 intervals)</CardDescription>
                  <div className="flex gap-2 p-1 bg-muted/30 rounded-sm">
                    <Badge variant="default" className="cursor-pointer">Index</Badge>
                    <Badge variant="outline" className="cursor-pointer opacity-50 hover:opacity-100">Live</Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex items-center justify-center relative">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Skeleton className="w-[90%] h-[70%]" />
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.05]" />

                      {/* SVG matches the container strictly */}
                      <svg viewBox="0 0 800 300" className="w-full h-full p-4 overflow-visible">
                        <path
                          d="M0,250 C100,250 150,150 300,200 C450,250 600,50 800,130"
                          fill="none"
                          stroke="var(--primary)"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="800" cy="130" r="4" fill="var(--primary)" />
                      </svg>

                      <div className="absolute bottom-6 right-6 font-mono text-[10px] text-muted-foreground flex gap-4 uppercase tracking-widest">
                        <span>X: Interval</span>
                        <span>Y: Performance Coefficient</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Section>
          </div>

          {/* Side Content (Span 4) */}
          <div className="col-span-12 lg:col-span-4">
            <Section
              title="identity links"
              icon="link"
              actions={
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              }
            >
              <Card className="min-h-[400px] flex flex-col">
                <CardContent className="grid grid-cols-2 gap-4 content-start pt-2">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square" />)
                  ) : handles.length === 0 ? (
                    <div className="col-span-2 py-12 flex flex-col items-center justify-center gap-4 border border-dashed border-border rounded-lg bg-muted/5">
                      <span className="material-symbols-outlined text-muted-foreground/20 text-4xl">link_off</span>
                      <p className="text-[10px] font-mono text-muted-foreground text-center px-4 uppercase tracking-widest">No external nodes connected.</p>
                      <button onClick={() => setIsAddModalOpen(true)} className="btn btn-secondary text-[8px] py-1">INIT_LINK</button>
                    </div>
                  ) : (
                    handles.map((h: Handle) => {
                      const sport = sports.find((s: Sport) => s.id === h.sportId);
                      return (
                        <div
                          key={h.id}
                          className="aspect-square bg-muted/30 border border-border/50 rounded flex flex-col items-center justify-center p-4 hover:border-primary/50 transition-all group relative cursor-pointer"
                          onClick={() => handleUnlink(h.id, h.handle)}
                        >
                          <div className="text-2xl font-black text-muted-foreground/20 group-hover:text-primary transition-colors">
                            {sport?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="text-[8px] font-mono font-bold text-muted-foreground uppercase mt-2 text-center truncate w-full">
                            {sport?.name || "Unknown"}
                          </div>
                          <div className="text-[7px] text-muted-foreground/40 font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {h.handle}
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[10px] text-destructive">close</span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {!loading && handles.length > 0 && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="aspect-square border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center group"
                    >
                      <span className="material-symbols-outlined text-muted-foreground/30 group-hover:text-primary transition-colors">add</span>
                    </button>
                  )}
                </CardContent>
              </Card>
            </Section>
          </div>
        </div>

        {/* --- Section 3: History --- */}
        <Section title="archived operations" icon="history">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[800px] flex flex-col">
                  <div className="grid grid-cols-7 px-6 py-4 bg-muted/30 border-b border-border text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="col-span-2">NODE_ID</div>
                    <div>OUTCOME</div>
                    <div>SCORE_VECTOR</div>
                    <div>UNIT_KPI</div>
                    <div>THEATER</div>
                    <div className="text-right">TIMESTAMP</div>
                  </div>

                  <div className="flex flex-col min-h-[300px]">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <div key={i} className="grid grid-cols-7 px-6 py-5 border-b border-border/50">
                          <Skeleton className="h-4 col-span-2 w-32" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </div>
                      ))
                    ) : handles.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 opacity-30 grayscale">
                        <span className="material-symbols-outlined text-6xl">database_off</span>
                        <span className="text-xs font-mono uppercase tracking-[0.4em]">Historical data synchronization failed: No source links.</span>
                      </div>
                    ) : (
                      <>
                        <MatchRow opponent="xSlayer99" result="Win" score="13 - 9" kda="18 / 4 / 2" map="Ascent" date="2h ago" />
                        <MatchRow opponent="NoobMaster" result="Loss" score="11 - 13" kda="12 / 15 / 4" map="Dust II" date="5h ago" />
                        <MatchRow opponent="Team Liquid" result="Win" score="2 - 0" kda="—" map="Bo3" date="1d ago" />
                        <MatchRow opponent="Faker" result="Loss" score="0 - 3" kda="2 / 10 / 1" map="Summoners Rift" date="2d ago" />
                        <MatchRow opponent="Cloud9" result="Win" score="16 - 4" kda="24 / 5 / 2" map="Inferno" date="3d ago" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      </Stack>

      {/* --- Link Account Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-md w-full shadow-2xl relative border-primary/20 p-0 overflow-hidden">
            <div className="p-8">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>

              <CardHeader className="p-0">
                <CardTitle className="text-2xl font-black uppercase tracking-tight">Sync Platform</CardTitle>
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest mt-2 leading-relaxed">
                  Connect your identity node to enable cross-platform career tracking and ranking analysis.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleLinkAccount} className="mt-8 space-y-6">
                <Stack gap="md">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Platform_Node</label>
                    <Select value={selectedSportId} onValueChange={setSelectedSportId}>
                      <SelectTrigger className="capitalize h-10 border border-border/50 focus:border-primary/50">
                        <SelectValue placeholder="Select Platform..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sports.map((sport: Sport) => (
                          <SelectItem key={sport.id} value={sport.id} className="capitalize">
                            {sport.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Node_Identifier</label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. FAKER#KR1"
                      className="input h-10 border border-border/50 focus:border-primary/50 text-sm"
                      required
                    />
                  </div>
                </Stack>

                <button
                  type="submit"
                  disabled={submitting || !identifier}
                  className="btn btn-primary w-full justify-center py-6 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl disabled:opacity-50"
                >
                  {submitting ? "RUNNING_AUTH..." : "INITIALIZE_CONNECTION"}
                </button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}
