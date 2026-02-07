import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { CustomBackground } from "@/components/CustomBackground";
import { Header } from "@/components/header/Header";
import { getServerUser } from "@/lib/auth";
import { JetBrains_Mono, Geist, Roboto } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: "400",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tournify",
  description: "Tournament management platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerUser();

  return (
    <html lang="en" className={jetbrains.className} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <CustomBackground />
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
            suppressHydrationWarning
          >
            <Header initialUser={user} />
            <div
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
              suppressHydrationWarning
            >
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
