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
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var s = JSON.parse(localStorage.getItem('tournify_settings') || '{}');
                  var root = document.documentElement;
                  root.classList.add('dark');
                  root.style.colorScheme = 'dark';
                  
                  if (s.themeColor) root.style.setProperty('--theme-color', s.themeColor);
                  if (s.borderRadius !== undefined) root.style.setProperty('--radius-base', s.borderRadius + 'px');
                  if (s.glassBlur !== undefined) root.style.setProperty('--glass-blur', s.glassBlur + 'px');
                  if (s.glassOpacity !== undefined) root.style.setProperty('--glass-opacity', s.glassOpacity);
                  
                  if (s.customTheme && s.customThemeColors) {
                    var c = s.customThemeColors;
                    if (c.bgPrimary) {
                      root.style.setProperty('--background', c.bgPrimary);
                      root.style.setProperty('--popover', c.bgPrimary);
                      root.style.setProperty('--card', c.bgPrimary);
                      root.style.setProperty('--secondary', c.bgSecondary || c.bgPrimary);
                    }
                    if (c.accent) {
                      root.style.setProperty('--theme-color', c.accent);
                      root.style.setProperty('--primary', c.accent);
                    }
                    if (c.textPrimary) {
                      root.style.setProperty('--foreground', c.textPrimary);
                      root.style.setProperty('--popover-foreground', c.textPrimary);
                      root.style.setProperty('--card-foreground', c.textPrimary);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
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
