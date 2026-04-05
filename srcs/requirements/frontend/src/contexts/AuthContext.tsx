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
import { logoutAction } from "@/lib/auth";
import { refreshToken } from "@/lib/api/auth-client";
import { setLocalSettings, applyAllSettings } from "@/lib/settings";
import { User } from "@ft-transcendence/contracts";
import { toast } from "@/components/ui/sonner";

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  tagline: string;
  avatar: string;
  banner: string;
  level: number;
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
  ) => Promise<{ success: boolean; error?: string; validationErrors?: any[] }>;
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

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.users.getMe({});
      
      if (response.status === 200) {
        setUser(extractUserInfo(response.body));
      } else {
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
          const { user: userData } = response.body;

          localStorage.setItem("isLoggedIn", "true");

          setUser(extractUserInfo(userData));

          try {
            const settingsResponse = await api.settings.getSettings({});
            if (settingsResponse.status === 200) {
              const settings = settingsResponse.body;
              setLocalSettings(settings);
              await applyAllSettings(settings);
            }
          } catch (error) {
            // Error handling logic - we don't log to console
          }

          router.refresh();
          return { success: true };
        } else {
          const body = response.body as { message?: string };
          return { success: false, error: body?.message || "Login failed" };
        }
      } catch {
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
          const { user: userData } = response.body;

          localStorage.setItem("isLoggedIn", "true");

          setUser(extractUserInfo(userData));

          router.refresh();
          return { success: true };
        } else {
          const body = response.body as { message?: string, errors?: any[] };
          return {
            success: false,
            error: body?.message || "Registration failed",
            validationErrors: body?.errors,
          };
        }
      } catch {
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
      await logoutAction();

      setUser(null);

      router.push("/");
      
      localStorage.removeItem("isLoggedIn");

      router.refresh();
    } catch (error) {
      // Error handling logic - we don't log to console
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const PROTECTED_ROUTES = ["/settings", "/profile", "/tournaments/create"];

    const lastLogoutRef = { current: 0 };

    const handleForcedLogout = () => {
      const now = Date.now();
      // Throttle to once every 5 seconds to prevent toast storms
      if (now - lastLogoutRef.current < 5000) return;
      lastLogoutRef.current = now;

      setUser(null);
      localStorage.removeItem("isLoggedIn");

      toast.info("Session expired, please login again");

      const currentPath = window.location.pathname;
      const isProtectedRoute = PROTECTED_ROUTES.some(route => currentPath.startsWith(route));

      if (isProtectedRoute) {
        router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      }
      
      router.refresh(); 
    };

    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, [router]);

  useEffect(() => {
    if (!user) {
      // Check for OAuth success signal (the canary flag might be missing on host redirect)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("oauth_success") === "true") {
        localStorage.setItem("isLoggedIn", "true");
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const thinksIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      
      if (thinksIsLoggedIn) {
        refreshUser();
      }
    }
  }, []);

  // Proactive Background Refresh Timer
  useEffect(() => {
    // Only run if the user is authenticated in this session
    if (!user) return;

    // 80% rule: refresh at 80% of total lifetime (50m token → 40m interval).
    const intervalFromEnv = process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS;
    const REFRESH_INTERVAL_MS = intervalFromEnv ? parseInt(intervalFromEnv) : 40 * 60 * 1000; 

    const backgroundRefresh = setInterval(async () => { 
      const success = await refreshToken();

      if (!success) {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(backgroundRefresh);
  }, [user]);

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
