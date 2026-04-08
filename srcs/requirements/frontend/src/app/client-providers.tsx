"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState, ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { AuthEffects } from "@/components/AuthEffects";
import { makeStore } from "@/lib/store/store";
import type { UserInfo } from "@/lib/types/user";

interface ClientProvidersProps {
    children: ReactNode;
    initialUser: UserInfo | null;
}

export default function ClientProviders({ children, initialUser }: ClientProvidersProps) {
    const store = useMemo(() => makeStore(initialUser), [initialUser]);

    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                    },
                },
            }),
    );

    return (
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <AuthEffects />
                <ThemeInitializer />
                {children}
                <Toaster />
            </QueryClientProvider>
        </Provider>
    );
}
