import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { CustomBackground } from "@/components/CustomBackground";
import { Header } from "@/components/header/Header";
import 'material-symbols';


export const metadata: Metadata = {
  title: "tournify",
  description: "Tournament management platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body suppressHydrationWarning>
        <Providers >
          <CustomBackground />
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
            suppressHydrationWarning
          >
            <Header />
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
