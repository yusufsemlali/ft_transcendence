import { ReactNode } from "react";
import { getServerUser } from "@/lib/auth";
import ClientProviders from "@/app/client-providers";

export default async function Providers({ children }: { children: ReactNode }) {
  const user = await getServerUser();
  return <ClientProviders initialUser={user}>{children}</ClientProviders>;
}
