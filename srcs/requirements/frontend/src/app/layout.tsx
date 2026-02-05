import type { Metadata } from "next";
import { Roboto_Mono, Lexend_Deca } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import { CustomBackground } from "@/components/CustomBackground";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
