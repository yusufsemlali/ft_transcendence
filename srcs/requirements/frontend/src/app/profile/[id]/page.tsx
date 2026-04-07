"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api/api";
import { User, Sport, Handle } from "@ft-transcendence/contracts";
import { toast } from "@/components/ui/sonner";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

  const showFallback = !src || imgError;

  return (
    <div className="relative w-40 h-48 sm:w-48 sm:h-56 group transition-transform duration-500 hover:scale-[1.02]">
      <div
        className="absolute inset-0 bg-primary opacity-10 blur-2xl rounded-3xl group-hover:opacity-20 transition-opacity"
        style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)" }}
      />
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

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [handles, setHandles] = useState<Handle[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
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
      } catch {
        if (!isMounted) return;
        toast.error("Failed to load profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [userId]);

  if (!loading && notFound) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-40">
          <span className="material-symbols-outlined text-6xl">person_off</span>
          <span className="text-xs font-mono uppercase tracking-[0.4em]">Player not found</span>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Stack gap="xl">
        {/* --- Header --- */}
        <Section title="player profile" icon="person">
          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-12 lg:col-span-3 flex justify-center lg:justify-start">
              <HexAvatar
                src={user?.avatar}
                alt={user?.username}
                isOnline={user?.isOnline}
                loading={loading}
              />
            </div>

            <div className="col-span-12 lg:col-span-9">
              <Stack gap="lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border/10 pb-8 gap-6">
                  <div className="space-y-4">
                    {loading ? (
                      <Skeleton className="h-12 w-64" />
                    ) : (
                      <>
                        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground flex items-center gap-4">
                          {user?.displayName || user?.username}
                          <Badge variant="outline" className="h-6 px-3">{user?.level ? `LVL ${user.level}` : "..."}</Badge>
                        </h1>
                        <div className="flex flex-wrap gap-4 items-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                          <span>@{user?.username}</span>
                          <span>·</span>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${user?.isOnline ? "bg-green-400 shadow-[0_0_8px_#4ade80]" : "bg-muted-foreground/30"}`} />
                            <span>{user?.isOnline ? "ONLINE" : "OFFLINE"}</span>
                          </div>
                          {user?.createdAt && (
                            <>
                              <span>·</span>
                              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest text-right">ELO Rating</div>
                    <div className="text-3xl font-black font-mono text-primary tracking-tighter">
                      {loading ? <Skeleton className="h-8 w-16" /> : user?.eloRating || 1200}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatModule label="Experience" value={user?.xp || 0} subtext="Total XP" loading={loading} />
                  <StatModule label="Level" value={user?.level || 1} subtext="Current" loading={loading} />
                  <StatModule label="ELO Rating" value={user?.eloRating || 1200} subtext="Ranked" loading={loading} />
                  <StatModule label="Status" value={user?.status || "—"} subtext="Account" loading={loading} />
                </div>
              </Stack>
            </div>
          </div>
        </Section>

        {/* --- Bio --- */}
        {user?.bio && (
          <Section title="about" icon="info">
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{user.bio}</p>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* --- Game Handles --- */}
        <Section title="identity links" icon="link">
          <Card>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square" />)
              ) : handles.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4 opacity-30">
                  <span className="material-symbols-outlined text-4xl">link_off</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest">No linked platforms</span>
                </div>
              ) : (
                handles.map((h: Handle) => {
                  const sport = sports.find((s: Sport) => s.id === h.sportId);
                  return (
                    <div
                      key={h.id}
                      className="aspect-square bg-muted/30 border border-border/50 rounded flex flex-col items-center justify-center p-4 hover:border-primary/50 transition-all group"
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
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Section>

        {/* --- Performance Placeholder --- */}
        <Section title="performance index" icon="monitoring">
          <Card className="min-h-[300px] flex flex-col relative overflow-hidden">
            <CardHeader className="flex-row justify-between items-center space-y-0">
              <CardDescription className="font-mono uppercase tracking-[0.15em]">Elo projection (last 30 intervals)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center relative">
              {loading ? (
                <Skeleton className="w-[90%] h-[70%]" />
              ) : (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.05]" />
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
      </Stack>
    </Page>
  );
}
