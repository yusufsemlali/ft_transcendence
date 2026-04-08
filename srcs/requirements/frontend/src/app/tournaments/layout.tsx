import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse tournaments | tournify",
  description:
    "Discover public tournaments, filter by game and status, and join when registration is open.",
};

export default function TournamentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
