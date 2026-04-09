import type { Response } from "express";

/** SSE clients keyed by tournament — all viewers of that lobby get refetch signals when state changes */
const clientsByTournament = new Map<string, Set<Response>>();

export function addLobbyStreamClient(tournamentId: string, res: Response): void {
    let set = clientsByTournament.get(tournamentId);
    if (!set) {
        set = new Set();
        clientsByTournament.set(tournamentId, set);
    }
    set.add(res);
}

export function removeLobbyStreamClient(tournamentId: string, res: Response): void {
    const set = clientsByTournament.get(tournamentId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
        clientsByTournament.delete(tournamentId);
    }
}

/** Call after any mutation that changes lobby/roster/invites for this tournament */
export function broadcastLobbyChanged(tournamentId: string): void {
    const set = clientsByTournament.get(tournamentId);
    if (!set || set.size === 0) return;

    const frame = `event: lobby_changed\ndata: ${JSON.stringify({ tournamentId })}\n\n`;
    const stale: Response[] = [];
    for (const res of set) {
        try {
            res.write(frame);
        } catch {
            stale.push(res);
        }
    }
    for (const res of stale) {
        set.delete(res);
    }
    if (set.size === 0) {
        clientsByTournament.delete(tournamentId);
    }
}
