"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { useAuth } from "@/lib/store/hooks";
import { LobbyTab } from "@/app/dashboard/_tabs/lobby";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PlayerLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const validId = UUID_RE.test(id);

  const tournamentQuery = useQuery({
    queryKey: ["public-tournament", id],
    queryFn: async () => {
      const res = await api.tournaments.getTournamentById({ params: { id } });
      if (res.status !== 200) throw new Error("Not found");
      return res.body.data;
    },
    enabled: validId,
  });

  if (!validId) {
    return (
      <div className="page" style={{ padding: "48px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Invalid link</h1>
        <p style={{ color: "var(--text-muted)" }}>This tournament URL is not valid.</p>
        <Link href="/tournaments" className="btn btn-primary" style={{ marginTop: "24px", display: "inline-block" }}>
          Back to tournaments
        </Link>
      </div>
    );
  }

  if (tournamentQuery.isPending) {
    return (
      <div className="page" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        <span className="material-symbols-outlined" style={{
          fontSize: "28px",
          color: "var(--primary)",
          animation: "spin 1s linear infinite",
        }}>progress_activity</span>
      </div>
    );
  }

  if (tournamentQuery.isError || !tournamentQuery.data) {
    return (
      <div className="page" style={{ padding: "48px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Tournament not found</h1>
        <p style={{ color: "var(--text-muted)" }}>
          It may be private, still in draft, or removed.
        </p>
        <Link href="/tournaments" className="btn btn-primary" style={{ marginTop: "24px", display: "inline-block" }}>
          Browse tournaments
        </Link>
      </div>
    );
  }

  const t = tournamentQuery.data;

  if (!user) {
    return (
      <div className="page" style={{ padding: "48px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>{t.name}</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          Log in to view the lobby and manage your team.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/tournaments/${id}/lobby`)}`}
          className="btn btn-primary"
          style={{ marginTop: "24px", display: "inline-block" }}
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="page" style={{ minHeight: "100vh", color: "var(--text-primary)" }}>
      {/* Tournament header bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px",
        flexWrap: "wrap",
      }}>
        <Link
          href={`/tournaments/${id}`}
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
          Back to details
        </Link>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {t.bannerUrl && (
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid var(--border-color)",
              flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{t.name}</h1>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
              {t.organizationName}
              <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
              <span className="badge" style={{ fontSize: "10px", textTransform: "uppercase" }}>{t.status}</span>
            </p>
          </div>
        </div>
      </div>

      <LobbyTab tournament={t} />
    </div>
  );
}
