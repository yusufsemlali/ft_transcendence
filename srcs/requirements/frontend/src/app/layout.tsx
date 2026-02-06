import type { Metadata } from "next";
import { Roboto_Mono, Lexend_Deca } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { CustomBackground } from "@/components/CustomBackground";
import { Header } from "@/components/header/Header";
import { getServerUser } from "@/lib/auth";

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${robotoMono.variable} ${lexendDeca.variable}`}
        suppressHydrationWarning
      >
        <Providers>
          <CustomBackground />
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }} suppressHydrationWarning>
            <Header initialUser={user} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }} suppressHydrationWarning>
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
