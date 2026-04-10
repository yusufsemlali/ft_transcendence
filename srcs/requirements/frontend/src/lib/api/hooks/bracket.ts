import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { toast } from "@/components/ui/sonner";
import type { BracketState, StandingsEntry, Match } from "@ft-transcendence/contracts";

export function useBracketState(tournamentId: string, enabled = true) {
    return useQuery<BracketState>({
        queryKey: ["bracket-state", tournamentId],
        queryFn: async () => {
            const res = await api.matches.getBracketState({
                params: { tournamentId },
            });
            if (res.status !== 200) throw new Error("Failed to load bracket");
            return res.body as BracketState;
        },
        enabled,
    });
}

export function useStandings(tournamentId: string, enabled = true) {
    return useQuery<StandingsEntry[]>({
        queryKey: ["standings", tournamentId],
        queryFn: async () => {
            const res = await api.matches.getStandings({
                params: { tournamentId },
            });
            if (res.status !== 200) throw new Error("Failed to load standings");
            return res.body as StandingsEntry[];
        },
        enabled,
        refetchInterval: 30_000,
    });
}

export function useTournamentMatches(tournamentId: string, enabled = true) {
    return useQuery<Match[]>({
        queryKey: ["tournament-matches", tournamentId],
        queryFn: async () => {
            const res = await api.matches.listTournamentMatches({
                params: { tournamentId },
            });
            if (res.status !== 200) throw new Error("Failed to load matches");
            return res.body as Match[];
        },
        enabled,
    });
}

export function useGenerateBracket(tournamentId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await api.matches.generateBracket({
                params: { tournamentId },
                body: {},
            });
            if (res.status !== 201) {
                const body = res.body as any;
                throw new Error(body?.message ?? "Failed to generate bracket");
            }
            return res.body;
        },
        onSuccess: () => {
            toast.success("Bracket generated successfully");
            queryClient.invalidateQueries({ queryKey: ["bracket-state", tournamentId] });
            queryClient.invalidateQueries({ queryKey: ["standings", tournamentId] });
            queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
        },
        onError: (e: Error) => toast.error(e.message),
    });
}

export function useResetBracket(tournamentId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await api.matches.resetBracket({
                params: { tournamentId },
            });
            if (res.status !== 200) {
                const body = res.body as any;
                throw new Error(body?.message ?? "Failed to reset bracket");
            }
            return res.body;
        },
        onSuccess: () => {
            toast.success("Bracket reset");
            queryClient.invalidateQueries({ queryKey: ["bracket-state", tournamentId] });
            queryClient.invalidateQueries({ queryKey: ["standings", tournamentId] });
            queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
        },
        onError: (e: Error) => toast.error(e.message),
    });
}

/** Updates score1/score2 only — does not complete the match. */
export function useReportScore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            matchId,
            score1,
            score2,
        }: {
            matchId: string;
            score1: number;
            score2: number;
        }) => {
            const res = await api.matches.reportScore({
                params: { id: matchId },
                body: { score1, score2 },
            });
            if (res.status !== 200) {
                const body = res.body as { message?: string };
                throw new Error(body?.message ?? "Failed to save scores");
            }
            return res.body;
        },
        onSuccess: () => {
            toast.success("Scores saved");
            queryClient.invalidateQueries({ queryKey: ["bracket-state"] });
            queryClient.invalidateQueries({ queryKey: ["standings"] });
            queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });
}

/** Completes the match and runs bracket advancement. */
export function useFinalizeMatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            matchId,
            score1,
            score2,
            winnerId,
        }: {
            matchId: string;
            score1: number;
            score2: number;
            winnerId?: string;
        }) => {
            const res = await api.matches.finalizeMatch({
                params: { id: matchId },
                body: { score1, score2, ...(winnerId !== undefined ? { winnerId } : {}) },
            });
            if (res.status !== 200) {
                const body = res.body as { message?: string };
                throw new Error(body?.message ?? "Failed to finalize match");
            }
            return res.body;
        },
        onSuccess: () => {
            toast.success("Match finalized");
            queryClient.invalidateQueries({ queryKey: ["bracket-state"] });
            queryClient.invalidateQueries({ queryKey: ["standings"] });
            queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });
}

export function useAdvanceSwissRound(tournamentId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await api.matches.advanceSwissRound({
                params: { tournamentId },
                body: {},
            });
            if (res.status !== 201) {
                const body = res.body as any;
                throw new Error(body?.message ?? "Failed to advance Swiss round");
            }
            return res.body;
        },
        onSuccess: (body) => {
            toast.success(body.message);
            queryClient.invalidateQueries({ queryKey: ["bracket-state", tournamentId] });
            queryClient.invalidateQueries({ queryKey: ["standings", tournamentId] });
            queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
        },
        onError: (e: Error) => toast.error(e.message),
    });
}
