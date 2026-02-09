"use client";

import { useState, useEffect } from "react";
import api  from "@/lib/api/api";
import {
  User,
  SupportedGame,
  SupportedGameSchema,
  GameProfile,
} from "@ft-transcendence/contracts";

import { toast } from "@/components/ui/sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function HexAvatar({
  src,
  alt,
  isOnline,
}: {
  src: string;
  alt: string;
  isOnline: boolean;
}) {
  return (
    <div className="relative w-48 h-56 group">
      {/* The Glowing Border/Container */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-primary to-purple-600 opacity-50 blur-md rounded-[2rem]"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)",
        }}
      />

      {/* The Actual Image Container */}
      <div
        className="absolute inset-[2px] bg-[#0F0F13] z-10 overflow-hidden"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)",
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Online Indicator (integrated into the shape) */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${isOnline ? "bg-green-400 shadow-[0_0_10px_#4ade80]" : "bg-gray-500"}`}
        />
      </div>
    </div>
  );
}

function StatModule({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <Card className="p-4 relative">
      <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">
        {label}
      </div>
      <div className="text-3xl font-black text-white font-mono tracking-tighter">
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-primary mt-1 font-medium">{subtext}</div>
      )}
    </Card>
  );
}

function MatchRow({ opponent, result, score, kda, map, date }: any) {
  const isWin = result === "Win";
  return (
    <div className="grid grid-cols-7 items-center py-3 border-b border-white/5 text-xs hover:bg-white/5 transition px-6 relative group">
      {/* Pink Highlight Bar */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-sm opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="font-bold text-white flex items-center gap-3 col-span-2">
        <div className="w-8 h-8 rounded-lg bg-gray-800 border border-white/10 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
        </div>
        <span className="truncate">{opponent}</span>
      </div>

      <div
        className={`${isWin ? "text-primary" : "text-destructive"} font-black uppercase tracking-widest text-[10px]`}
      >
        {result}
      </div>

      <div className="font-mono text-gray-400">{score}</div>
      <div className="font-mono text-gray-400">{kda}</div>
      <div className="text-gray-500 font-medium">{map}</div>
      <div className="text-gray-600 text-[10px] text-right">{date}</div>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<GameProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] =
    useState<SupportedGame>("league_of_legends");
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [userRes, profilesRes] = await Promise.all([
        api.users.getMe(),
        api.gameProfiles.getMyProfiles(),
      ]);

      if (userRes.status === 200) setUser(userRes.body);
      if (profilesRes.status === 200) setProfiles(profilesRes.body);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await api.gameProfiles.create({
        body: { game: selectedGame, gameIdentifier: identifier },
      });

      if (res.status === 201) {
        setProfiles([...profiles, res.body]);
        setIsAddModalOpen(false);
        setIdentifier("");
        toast.success(`Linked ${selectedGame}`);
      } else {
        toast.error(`Error: ${(res as any).body?.message}`);
      }
    } catch (error) {
      toast.error("Failed to link");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async (game: SupportedGame) => {
    if (!confirm(`Unlink ${game}?`)) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await api.gameProfiles.delete({
        params: { game },
      });
      setProfiles(profiles.filter((p) => p.game !== game));
      toast.success("Unlinked");
    } catch (error) {
      toast.error("Failed");
    }
  };

  if (loading || !user)
    return (
      <div className="p-20 text-center animate-pulse text-gray-500 font-mono">
        INITIALIZING SYSTEM...
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        backgroundColor: "transparent",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* --- Section 1: Header Dashboard --- */}
        <div style={{ position: "relative", marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              gap: "32px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* 1. Avatar (Left) */}
            <div style={{ flexShrink: 0 }}>
              <HexAvatar
                src={user.avatar || "/default-avatar.png"}
                alt={user.username}
                isOnline={true}
              />
            </div>

            {/* 2. Info & Stats (Right) */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              {/* Top Row: Info */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "24px",
                  marginBottom: "24px",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: "48px",
                      fontWeight: "800",
                      margin: "0 0 8px 0",
                      textTransform: "uppercase",
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    {user.displayName || user.username}
                    <span
                      style={{
                        fontSize: "12px",
                        background: "rgba(var(--primary-rgb), 0.2)",
                        color: "var(--primary)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(var(--primary-rgb), 0.3)",
                        fontWeight: "600",
                        letterSpacing: "1px",
                      }}
                    >
                      LVL {user.level}
                    </span>
                  </h1>
                  <div
                    style={{
                      display: "flex",
                      gap: "24px",
                      alignItems: "center",
                      fontSize: "14px",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--accent-success)",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "currentColor",
                          boxShadow: "0 0 8px currentColor",
                        }}
                      />
                      ONLINE
                    </span>
                    <span>ID: #{user.id.toString().padStart(4, "0")}</span>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      style={{
                        color: "var(--text-primary)",
                        textDecoration: "underline",
                        textDecorationStyle: "dashed",
                        textUnderlineOffset: "4px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      + Link Account
                    </button>
                  </div>
                </div>

                <div
                  className="glass"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                    }}
                  >
                    TEAM
                  </span>
                </div>
              </div>

              {/* Bottom Row: Stat Modules */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "16px",
                }}
              >
                <StatModule
                  label="Matches Played"
                  value="5"
                  subtext="Career matches"
                />
                <StatModule
                  label="Tournaments"
                  value="0"
                  subtext="Participated"
                />
                <StatModule label="Win Rate" value="-" subtext="Global Avg" />
                <StatModule
                  label="Reputation"
                  value="100%"
                  subtext="Good Standing"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- Section 2: Main Grid Layout --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Left Column: Performance Graph (Span 8) */}
          <Card className="col-span-8 p-6 flex flex-col min-h-[350px]">
            <CardHeader className="p-0 mb-8 border-none !px-0">
              <div className="flex justify-between items-center w-full">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full transition-colors" />
                  Performance History
                </CardTitle>
                <div className="flex gap-2 text-xs bg-black/20 p-1 rounded-lg">
                  <span className="px-3 py-1 bg-white/10 rounded text-white cursor-pointer hover:bg-white/20 transition">
                    30 Days
                  </span>
                  <span className="px-3 py-1 text-gray-500 cursor-pointer hover:text-white transition">
                    All Time
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 w-full relative h-[200px] z-10 !px-0">
              {/* Graph */}
              <div className="w-full h-full relative">
                <svg
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,150 C100,150 150,50 300,100 C450,150 600,0 800,80 L800,200 L0,200 Z"
                    fill="url(#gradient-fill)"
                    opacity="0.1"
                  />
                  <path
                    d="M0,150 C100,150 150,50 300,100 C450,150 600,0 800,80"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    filter="drop-shadow(0 0 10px rgba(var(--primary-rgb), 0.5))"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="gradient-fill"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity="0.5"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </CardContent>

            {/* Graph Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.05)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
          </Card>

          {/* Right Column: Linked Games (Span 4) */}
          <Card className="col-span-4 p-6 flex flex-col min-h-[350px]">
            <CardHeader className="p-0 mb-6 border-none !px-0">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full transition-colors" />
                Linked Games
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 flex-1 grid grid-cols-2 gap-3 content-start !px-0">
              {profiles.map((p) => (
                <div
                  key={p.game}
                  className="aspect-square bg-white/5 rounded-2xl flex flex-col items-center justify-center p-4 hover:bg-white/10 hover:scale-[1.02] transition cursor-pointer group relative overflow-hidden border border-white/5"
                  onClick={() => handleUnlink(p.game)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition" />

                  <div className="font-black text-4xl mb-2 text-white/20 group-hover:text-white transition-colors">
                    {p.game.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-primary transition-colors text-center leading-tight">
                    {p.game.replace(/_/g, " ")}
                  </div>
                </div>
              ))}

              {/* Add Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600 hover:text-white hover:border-white/30 hover:bg-white/5 transition group"
              >
                <span className="text-4xl font-light group-hover:scale-110 transition">
                  +
                </span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* --- Section 3: Match History Table --- */}
        <Card className="overflow-hidden border-none bg-transparent">
          <CardHeader className="flex flex-col items-center gap-6 p-8 border-none bg-transparent">
            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-4">
              <span className="w-1.5 h-4 bg-primary rounded-full shadow-[0_0_12px_rgba(236,72,153,0.5)]" />
              Match History
            </CardTitle>

            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
              <button className="px-8 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-wider rounded-lg shadow-xl hover:scale-105 transition-transform active:scale-95">
                Challenge
              </button>
              <button className="px-8 py-2.5 bg-transparent text-gray-400 text-[11px] font-black uppercase tracking-wider rounded-lg hover:text-white transition-colors">
                Add Friend
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto !px-0 bg-black/20 backdrop-blur-sm rounded-3xl border border-white/5">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-black/60 border-b border-white/5">
                <div className="col-span-2">Opponent</div>
                <div>Result</div>
                <div>Score</div>
                <div>KDA</div>
                <div>Map</div>
                <div className="text-right">Date</div>
              </div>

              <div className="divide-y divide-white/5">
                <MatchRow
                  opponent="xSlayer99"
                  result="Win"
                  score="13 - 9"
                  kda="18 / 4 / 2"
                  map="Ascent"
                  date="2h ago"
                />
                <MatchRow
                  opponent="NoobMaster"
                  result="Loss"
                  score="11 - 13"
                  kda="12 / 15 / 4"
                  map="Dust II"
                  date="5h ago"
                />
                <MatchRow
                  opponent="Team Liquid"
                  result="Win"
                  score="2 - 0"
                  kda="—"
                  map="Bo3"
                  date="1d ago"
                />
                <MatchRow
                  opponent="Faker"
                  result="Loss"
                  score="0 - 3"
                  kda="2 / 10 / 1"
                  map="Summoners Rift"
                  date="2d ago"
                />
                <MatchRow
                  opponent="Cloud9"
                  result="Win"
                  score="16 - 4"
                  kda="24 / 5 / 2"
                  map="Inferno"
                  date="3d ago"
                />

                {profiles.length === 0 && (
                  <div className="p-12 text-center text-gray-600 italic">
                    Link game profiles to populate match history.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Game Modal (Reused) - Keeping same logic */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <span className="sr-only">Close</span>
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Link Account
              </h3>
              <p className="text-gray-400 text-sm">
                Select a game and enter your public identifier to track stats.
              </p>
            </div>

            <form onSubmit={handleLinkAccount} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Platform
                </label>
                <div className="relative">
                  <select
                    value={selectedGame}
                    onChange={(e) =>
                      setSelectedGame(e.target.value as SupportedGame)
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none capitalize transition-all"
                  >
                    {SupportedGameSchema.options.map((game) => (
                      <option
                        key={game}
                        value={game}
                        className="bg-gray-900 text-white py-2"
                      >
                        {game.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Identifier
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    selectedGame === "league_of_legends"
                      ? "Faker#KR1"
                      : selectedGame === "cs2"
                        ? "SteamID 64"
                        : "Player ID"
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono placeholder-gray-700 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !identifier}
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-wider rounded-xl hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
              >
                {submitting ? "Verifying..." : "Link Profile"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
