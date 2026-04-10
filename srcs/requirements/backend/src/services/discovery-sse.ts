import type { Response } from "express";

/** SSE clients watching the tournament discovery list */
const discoveryClients = new Set<Response>();

export function addDiscoveryClient(res: Response): void {
    discoveryClients.add(res);
}

export function removeDiscoveryClient(res: Response): void {
    discoveryClients.delete(res);
}

/** 
 * Call after any mutation that affects the public tournament list
 * (Creation, Status Change, etc.)
 */
export function broadcastDiscoveryUpdate(): void {
    if (discoveryClients.size === 0) return;

    const frame = `event: discovery_update\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
    const stale: Response[] = [];

    for (const res of discoveryClients) {
        try {
            res.write(frame);
        } catch {
            stale.push(res);
        }
    }

    for (const res of stale) {
        discoveryClients.delete(res);
    }
}
