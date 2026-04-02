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
          const { token, user: userData } = response.body;

          await setAuthCookies(token); 

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
            console.error("Failed to load user settings:", error);
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
          const { token, user: userData } = response.body;

          await setAuthCookies(token);

          localStorage.setItem("isLoggedIn", "true");

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
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const PROTECTED_ROUTES = ["/settings", "/profile", "/tournaments/create"];

    const handleForcedLogout = () => {
      setUser(null);
      
      localStorage.removeItem("isLoggedIn");

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
      const thinksIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      
      if (thinksIsLoggedIn) {
        refreshUser();
      }
    }
  }, []);

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
