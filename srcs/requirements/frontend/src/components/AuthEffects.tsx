"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setUser, refreshUserThunk } from "@/lib/store/authSlice";
import { refreshToken } from "@/lib/api/auth-client";
import { toast } from "@/components/ui/sonner";

const PROTECTED_ROUTES = ["/settings", "/profile", "/tournaments/create"];

/**
 * Headless component that wires up auth side-effects:
 *  1. Forced-logout event listener (auth:logout)
 *  2. OAuth / hydration check on mount
 *  3. Background token refresh timer
 */
export function AuthEffects() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();

  // 1. Forced-logout listener
  useEffect(() => {
    let lastLogoutAt = 0;

    const handleForcedLogout = () => {
      const now = Date.now();
      if (now - lastLogoutAt < 5000) return;
      lastLogoutAt = now;

      const wasLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      dispatch(setUser(null));
      localStorage.removeItem("isLoggedIn");

      if (wasLoggedIn) {
        toast.info("Session expired, please login again");
      }

      const currentPath = window.location.pathname;
      const isProtected = PROTECTED_ROUTES.some((r) =>
        currentPath.startsWith(r),
      );

      if (isProtected) {
        router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      }

      router.refresh();
    };

    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, [dispatch, router]);

  // 2. Hydration: OAuth redirect or stale localStorage flag
  useEffect(() => {
    if (!user) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("oauth_success") === "true") {
        localStorage.setItem("isLoggedIn", "true");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }

      if (localStorage.getItem("isLoggedIn") === "true") {
        dispatch(refreshUserThunk());
      }
    }
  }, [dispatch, user]);

  // 3. Proactive background token refresh
  useEffect(() => {
    if (!user) return;

    const intervalFromEnv = process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS;
    const REFRESH_INTERVAL_MS = intervalFromEnv
      ? parseInt(intervalFromEnv, 10)
      : 40 * 60 * 1000;

    const id = setInterval(async () => {
      const ok = await refreshToken();
      if (!ok) {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [user]);

  return null;
}
