"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { StandingsTable } from "@/components/brackets";
import type { StandingsEntry, BracketType } from "@ft-transcendence/contracts";
import type { Tournament, Organization } from "@ft-transcendence/contracts";

interface StandingsTabProps {
    tournament: Tournament;
    org: Organization;
}

export function StandingsTab({ tournament }: StandingsTabProps) {
    const standingsQuery = useQuery<StandingsEntry[]>({
        queryKey: ["standings", tournament.id],
        queryFn: async () => {
            const res = await api.matches.getStandings({
                params: { tournamentId: tournament.id },
            });
            if (res.status !== 200) throw new Error("Failed to load standings");
            return res.body as StandingsEntry[];
        },
        refetchInterval: 30_000,
    });

    if (standingsQuery.isPending) {
        return (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                Loading standings…
            </div>
        );
    }

    if (standingsQuery.isError) {
        return (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                Could not load standings.
            </div>
        );
    }

    if (!standingsQuery.data || standingsQuery.data.length === 0) {
        return (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "40px", opacity: 0.3 }}>leaderboard</span>
                <p style={{ marginTop: "12px" }}>No standings yet. Matches need to be played first.</p>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>leaderboard</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Tournament Standings</span>
            </div>
            <StandingsTable
                standings={standingsQuery.data}
                bracketType={tournament.bracketType as BracketType}
            />
        </div>
    );
}
