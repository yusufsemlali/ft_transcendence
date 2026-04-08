import type { Metadata } from "next";
import { getPublicTournamentMeta } from "@/lib/public-tournament-meta";
import { TournamentDetailClient } from "./tournament-detail-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const meta = await getPublicTournamentMeta(id);
  if (!meta) {
    return { title: "Tournament | tournify" };
  }
  return {
    title: `${meta.name} | tournify`,
    description: meta.description ? meta.description.slice(0, 160) : undefined,
    openGraph: meta.bannerUrl
      ? { images: [{ url: meta.bannerUrl }] }
      : undefined,
  };
}

export default async function TournamentPublicDetailPage({ params }: Props) {
  const { id } = await params;
  return <TournamentDetailClient id={id} />;
}
