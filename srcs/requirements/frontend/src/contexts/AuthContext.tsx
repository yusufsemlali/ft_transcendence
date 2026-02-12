"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/api";
import { logoutAction, setAuthCookies } from "@/lib/auth";
import { setLocalSettings, applyAllSettings } from "@/lib/settings";
import { User } from "@ft-transcendence/contracts";

// UserInfo that matches what we actually use in the UI
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  level: number;
  avatar: string;
  role: string;
}

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: UserInfo | null;
}

function extractUserInfo(userData: User): UserInfo {
  return {
    id: userData.id || "",
    username: userData.username || "",
    email: userData.email || "",
    level: userData.level ?? 1,
    avatar:
      userData.avatar ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    role: userData.role || "user",
  };
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      const response = await api.users.getMe({});
      if (response.status === 200) {
        setUser(extractUserInfo(response.body));
      } else {
        const refreshResponse = await api.auth.refresh({ body: {} });
        if (refreshResponse.status === 200) {
          localStorage.setItem("token", refreshResponse.body.token);
          const retryResponse = await api.users.getMe({});
          if (retryResponse.status === 200) {
            setUser(extractUserInfo(retryResponse.body));
            return;
          }
        }
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await api.auth.login({
          body: { email, password },
        });

        if (response.status === 200) {
          const { token, user: userData } = response.body;

          // Store token in localStorage for client-side API calls
          localStorage.setItem("token", token);

          // Set httpOnly cookie for server-side
          await setAuthCookies(token);

          // Update state
          setUser(extractUserInfo(userData));

          // Fetch and apply user settings
          try {
            const settingsResponse = await api.settings.getSettings({});
            if (settingsResponse.status === 200) {
              const settings = settingsResponse.body;
              // Save to local storage so they persist
              setLocalSettings(settings);
              // Apply immediately
              await applyAllSettings(settings);
            }
          } catch (error) {
            console.error("Failed to load user settings:", error);
          }

          router.refresh();
          return { success: true };
        } else {
          const body = response.body as { message?: string };
          return { success: false, error: body?.message || "Login failed" };
        }
      } catch {
        // Only log unexpected errors, not auth failures
        return { success: false, error: "An unexpected error occurred" };
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await api.auth.register({
          body: { email, username, password },
        });

        if (response.status === 201) {
          const { token, user: userData } = response.body;

          localStorage.setItem("token", token);
          await setAuthCookies(token);

          setUser(extractUserInfo(userData));

          router.refresh();
          return { success: true };
        } else {
          const body = response.body as { message?: string };
          return {
            success: false,
            error: body?.message || "Registration failed",
          };
        }
      } catch {
        // Only log unexpected errors, not validation failures
        return { success: false, error: "An unexpected error occurred" };
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call server action to logout (invalidates session on backend)
      await logoutAction();

      // Clear client-side token
      localStorage.removeItem("token");

      // Clear user state
      setUser(null);

      // Redirect to home
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;

    // Refresh token every 50 minutes (before 1 hour expiry)
    const refreshInterval = setInterval(
      async () => {
        try {
          const response = await api.auth.refresh({ body: {} });
          if (response.status === 200) {
            localStorage.setItem("token", response.body.token);
            await setAuthCookies(response.body.token);
          } else {
            // Refresh failed, logout
            await logout();
          }
        } catch {
          // Token refresh failed - this is expected when session expires
        }
      },
      50 * 60 * 1000,
    ); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [user, logout]);

  // Listen for forced logout events from the API client
  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      localStorage.removeItem("token");
      router.push("/login");
      router.refresh();
    };

    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
