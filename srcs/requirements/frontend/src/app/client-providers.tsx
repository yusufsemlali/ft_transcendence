"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { AuthProvider, UserInfo } from "@/contexts/AuthContext";

interface ClientProvidersProps {
    children: ReactNode;
    initialUser: UserInfo | null;
}

export default function ClientProviders({ children, initialUser }: ClientProvidersProps) {
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
        <QueryClientProvider client={queryClient}>
            <AuthProvider initialUser={initialUser}>
                <ThemeInitializer />
                {children}
                <Toaster />
            </AuthProvider>
        </QueryClientProvider>
    );
}
