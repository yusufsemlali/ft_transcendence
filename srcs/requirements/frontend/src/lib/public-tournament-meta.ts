const BACKEND_URL = process.env.INTERNAL_BACKEND_API_URL || "http://ft_backend:3000/api";

export type PublicTournamentMeta = {
  name: string;
  description: string | null;
  bannerUrl: string | null;
};

/** Server-only fetch for SEO metadata (public discovery endpoint, no auth). */
export async function getPublicTournamentMeta(
  id: string,
): Promise<PublicTournamentMeta | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/tournaments/${id}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: PublicTournamentMeta };
    const d = json.data;
    if (!d?.name) return null;
    return {
      name: d.name,
      description: d.description ?? null,
      bannerUrl: d.bannerUrl ?? null,
    };
  } catch {
    return null;
  }
}
