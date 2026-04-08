import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { AppDispatch, RootState } from "./store";
import {
  loginThunk,
  registerThunk,
  logoutThunk,
  refreshUserThunk,
} from "./authSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const isLoading = useAppSelector((s) => s.auth.isLoading);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await dispatch(loginThunk({ email, password })).unwrap();
      if (result.success) router.refresh();
      return result;
    },
    [dispatch, router],
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const result = await dispatch(
        registerThunk({ email, username, password }),
      ).unwrap();
      if (result.success) router.refresh();
      return result;
    },
    [dispatch, router],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutThunk());
    router.push("/");
    router.refresh();
  }, [dispatch, router]);

  const refreshUser = useCallback(async () => {
    await dispatch(refreshUserThunk());
  }, [dispatch]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };
}
