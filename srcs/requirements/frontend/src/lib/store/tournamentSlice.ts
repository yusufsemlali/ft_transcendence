import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { Tournament, BracketState, StandingsEntry } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";

export interface TournamentState {
  discovery: {
    items: Tournament[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  details: {
    [tournamentId: string]: {
      data: Tournament | null;
      bracket: BracketState | null;
      standings: StandingsEntry[] | null;
      isLoading: boolean;
      error: string | null;
    };
  };
}

const initialState: TournamentState = {
  discovery: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    isLoading: false,
    error: null,
  },
  details: {},
};

// ── Thunks ──

export const fetchDiscoveryThunk = createAsyncThunk(
  "tournament/fetchDiscovery",
  async (query: any) => {
    const res = await api.tournaments.getTournaments({ query });
    if (res.status === 200) return res.body;
    throw new Error("Failed to fetch tournaments");
  }
);

export const fetchTournamentDetailThunk = createAsyncThunk(
  "tournament/fetchDetail",
  async (id: string) => {
    const [detailRes, bracketRes, standingsRes] = await Promise.all([
      api.tournaments.getTournamentById({ params: { id } }),
      api.matches.getBracketState({ params: { tournamentId: id } }),
      api.matches.getStandings({ params: { tournamentId: id } }),
    ]);

    if (detailRes.status !== 200) throw new Error("Failed to fetch tournament details");
    
    return {
      id,
      data: detailRes.body.data,
      bracket: bracketRes.status === 200 ? bracketRes.body : null,
      standings: standingsRes.status === 200 ? standingsRes.body : null,
    };
  }
);

export const reportScoreThunk = createAsyncThunk(
  "tournament/reportScore",
  async ({ matchId, tournamentId, s1, s2 }: { matchId: string; tournamentId: string; s1: number; s2: number }, { dispatch }) => {
    const res = await api.matches.reportScore({
      params: { id: matchId },
      body: { score1: s1, score2: s2 },
    });
    if (res.status !== 200) throw new Error("Failed to save scores");
    dispatch(fetchTournamentDetailThunk(tournamentId));
    return res.body;
  }
);

export const finalizeMatchThunk = createAsyncThunk(
  "tournament/finalizeMatch",
  async ({ matchId, tournamentId, s1, s2 }: { matchId: string; tournamentId: string; s1: number; s2: number }, { dispatch }) => {
    const res = await api.matches.finalizeMatch({
      params: { id: matchId },
      body: { score1: s1, score2: s2 },
    });
    if (res.status !== 200) throw new Error("Failed to finalize match");
    // After finalized, we re-fetch the bracket and standings
    dispatch(fetchTournamentDetailThunk(tournamentId));
    return res.body;
  }
);

const tournamentSlice = createSlice({
  name: "tournament",
  initialState,
  reducers: {
    updateTournamentInDiscovery(state, action: PayloadAction<Tournament>) {
      const index = state.discovery.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.discovery.items[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Discovery
      .addCase(fetchDiscoveryThunk.pending, (state) => {
        state.discovery.isLoading = true;
        state.discovery.error = null;
      })
      .addCase(fetchDiscoveryThunk.fulfilled, (state, action) => {
        state.discovery.isLoading = false;
        state.discovery.items = action.payload.tournaments;
        state.discovery.total = action.payload.total;
        state.discovery.page = action.payload.page;
        state.discovery.pageSize = action.payload.pageSize;
        state.discovery.totalPages = action.payload.totalPages;
      })
      .addCase(fetchDiscoveryThunk.rejected, (state, action) => {
        state.discovery.isLoading = false;
        state.discovery.error = action.error.message || "Failed to fetch discovery";
      })
      
      // Details
      .addCase(fetchTournamentDetailThunk.pending, (state, action) => {
        const id = action.meta.arg;
        if (!state.details[id]) {
          state.details[id] = { data: null, bracket: null, standings: null, isLoading: true, error: null };
        } else {
          state.details[id].isLoading = true;
        }
      })
      .addCase(fetchTournamentDetailThunk.fulfilled, (state, action) => {
        const { id, data, bracket, standings } = action.payload;
        state.details[id] = {
          data,
          bracket,
          standings,
          isLoading: false,
          error: null,
        };
      })
      .addCase(fetchTournamentDetailThunk.rejected, (state, action) => {
        const id = action.meta.arg;
        if (state.details[id]) {
          state.details[id].isLoading = false;
          state.details[id].error = action.error.message || "Failed to fetch tournament details";
        }
      });
  },
});

export const { updateTournamentInDiscovery } = tournamentSlice.actions;
export default tournamentSlice.reducer;
