import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { UserInfo } from "@/lib/types/user";
import type { User } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { logoutAction } from "@/lib/auth";
import { syncUserSettingsFromServer } from "@/lib/settings";

export type { UserInfo };

function extractUserInfo(userData: User): UserInfo {
  return {
    id: userData.id || "",
    username: userData.username || "",
    email: userData.email || "",
    displayName: userData.displayName || "",
    bio: userData.bio || "",
    tagline: userData.tagline || "",
    avatar:
      userData.avatar ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    banner: userData.banner || "",
    level: userData.level ?? 1,
    role: userData.role || "user",
  };
}

// ── Thunks ──

export const loginThunk = createAsyncThunk<
  { success: true } | { success: false; error: string },
  { email: string; password: string }
>("auth/login", async ({ email, password }, { dispatch }) => {
  try {
    const response = await api.auth.login({ body: { email, password } });

    if (response.status === 200) {
      const { user: userData } = response.body;
      localStorage.setItem("isLoggedIn", "true");
      dispatch(setUser(extractUserInfo(userData)));
      await syncUserSettingsFromServer();

      return { success: true as const };
    }

    const body = response.body as { message?: string };
    return { success: false as const, error: body?.message || "Login failed" };
  } catch {
    return { success: false as const, error: "An unexpected error occurred" };
  }
});

export const registerThunk = createAsyncThunk<
  { success: true } | { success: false; error: string; validationErrors?: any[] },
  { email: string; username: string; password: string }
>("auth/register", async ({ email, username, password }, { dispatch }) => {
  try {
    const response = await api.auth.register({
      body: { email, username, password },
    });

    if (response.status === 201) {
      const { user: userData } = response.body;
      localStorage.setItem("isLoggedIn", "true");
      dispatch(setUser(extractUserInfo(userData)));
      return { success: true as const };
    }

    const body = response.body as { message?: string; errors?: any[] };
    return {
      success: false as const,
      error: body?.message || "Registration failed",
      validationErrors: body?.errors,
    };
  } catch {
    return { success: false as const, error: "An unexpected error occurred" };
  }
});

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await logoutAction();
    } catch {
      // ignore server-side errors
    }
    dispatch(setUser(null));
    localStorage.removeItem("isLoggedIn");
  },
);

export const refreshUserThunk = createAsyncThunk(
  "auth/refreshUser",
  async (_, { dispatch }) => {
    try {
      const response = await api.users.getMe({});
      if (response.status === 200) {
        dispatch(setUser(extractUserInfo(response.body)));
      } else {
        dispatch(setUser(null));
      }
    } catch {
      dispatch(setUser(null));
    }
  },
);

// ── Slice ──

export interface AuthState {
  user: UserInfo | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserInfo | null>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.isLoading = true; })
      .addCase(loginThunk.fulfilled, (state) => { state.isLoading = false; })
      .addCase(loginThunk.rejected, (state) => { state.isLoading = false; })

      .addCase(registerThunk.pending, (state) => { state.isLoading = true; })
      .addCase(registerThunk.fulfilled, (state) => { state.isLoading = false; })
      .addCase(registerThunk.rejected, (state) => { state.isLoading = false; })

      .addCase(logoutThunk.pending, (state) => { state.isLoading = true; })
      .addCase(logoutThunk.fulfilled, (state) => { state.isLoading = false; })
      .addCase(logoutThunk.rejected, (state) => { state.isLoading = false; });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
