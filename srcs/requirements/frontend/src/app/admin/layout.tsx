"use client";

import { useAuth } from "@/lib/store/hooks";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <div className="absolute h-10 w-10 animate-ping rounded-full border-2 border-primary/20"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Secure Access</h2>
            <p className="text-sm text-muted-foreground animate-pulse">Verifying administrative credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; 
  }

  return (
    <div className="admin-portal-wrapper w-full h-full animate-in fade-in duration-500">
      {children}
    </div>
  );
}
