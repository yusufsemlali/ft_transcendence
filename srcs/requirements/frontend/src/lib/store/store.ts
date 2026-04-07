import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import type { UserInfo } from "@/lib/types/user";

export function makeStore(initialUser: UserInfo | null) {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: initialUser,
        isLoading: false,
      },
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
