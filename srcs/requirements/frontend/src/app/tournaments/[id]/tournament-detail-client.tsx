"use client";
/* eslint-disable @next/next/no-img-element */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api/api";
import { useAuth } from "@/lib/store/hooks";
import { toast } from "@/components/ui/sonner";
import { toastApiError, formatApiErrorBody } from "@/lib/api-error";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function TournamentDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const validId = UUID_RE.test(id);

  const detailQuery = useQuery({
    queryKey: ["public-tournament", id],
    queryFn: async () => {
      const res = await api.tournaments.getTournamentById({ params: { id } });
      if (res.status !== 200) {
        if (res.status !== 404) {
          toastApiError(res.body, "Failed to load tournament");
        }
        throw new Error("Not found");
      }
      return res.body.data;
    },
    enabled: validId,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.joinLobby({ params: { id }, body: {} });
      if (res.status !== 201) {
        throw new Error(formatApiErrorBody(res.body, "Could not join lobby"));
      }
      return res.body;
    },
    onSuccess: (body) => {
      toast.success(
        body.state === "COMPETITOR_CREATED"
          ? "You are registered. Opening dashboard…"
          : "Joined the lobby. Opening dashboard…",
      );
      queryClient.invalidateQueries({ queryKey: ["public-tournament", id] });
      router.push("/dashboard");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
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

  if (detailQuery.isPending) {
    return (
      <div className="page" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading tournament…
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
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

  const t = detailQuery.data;
  const callbackUrl = `/tournaments/${id}`;

  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        color: "var(--text-primary)",
        maxWidth: "900px",
        margin: "0 auto",
        paddingBottom: "48px",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/tournaments"
          style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}
        >
          ← All tournaments
        </Link>
      </div>

      <div
        className="glass-card"
        style={{ overflow: "hidden", border: "1px solid var(--border-color)", marginBottom: "24px" }}
      >
        <div style={{ height: "220px", background: "var(--bg-tertiary)", position: "relative" }}>
          <img
            src={t.bannerUrl || "/images/leage.jpeg"}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, var(--bg-primary), transparent 40%)",
            }}
          />
          <span
            className="badge"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              textTransform: "uppercase",
              fontSize: "11px",
              letterSpacing: "0.05em",
            }}
          >
            {t.status}
          </span>
        </div>

        <div style={{ padding: "28px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent-info)", fontWeight: 600 }}>{t.sportName}</span>
            <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
            Hosted by{" "}
            <strong style={{ color: "var(--text-primary)" }}>{t.organizationName}</strong>
          </p>
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 600, lineHeight: 1.2 }}>
            {t.name}
          </h1>
          {t.description ? (
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
              }}
            >
              {t.description}
            </p>
          ) : null}

          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "16px",
              marginTop: "28px",
              fontSize: "13px",
            }}
          >
            <div>
              <dt style={{ color: "var(--text-muted)", marginBottom: "4px" }}>Mode</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{t.mode}</dd>
            </div>
            <div>
              <dt style={{ color: "var(--text-muted)", marginBottom: "4px" }}>Bracket</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{t.bracketType.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt style={{ color: "var(--text-muted)", marginBottom: "4px" }}>Team size</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>
                {t.minTeamSize === t.maxTeamSize
                  ? `${t.minTeamSize}`
                  : `${t.minTeamSize}–${t.maxTeamSize}`}
              </dd>
            </div>
            <div>
              <dt style={{ color: "var(--text-muted)", marginBottom: "4px" }}>Participants</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>
                {t.minParticipants}–{t.maxParticipants}
              </dd>
            </div>
            <div>
              <dt style={{ color: "var(--text-muted)", marginBottom: "4px" }}>Prize</dt>
              <dd style={{ margin: 0, fontWeight: 600, color: "var(--accent-success)" }}>
                {t.prizePool || "—"}
              </dd>
            </div>
            {t.entryFee > 0 ? (
              <div>
                <dt style={{ color: "var(--text-muted)", marginBottom: "4px" }}>Entry fee</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{t.entryFee}</dd>
              </div>
            ) : null}
          </dl>

          <div style={{ marginTop: "32px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {user ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={joinMutation.isPending || t.status !== "registration"}
                onClick={() => joinMutation.mutate()}
                style={{ padding: "10px 24px" }}
              >
                {joinMutation.isPending ? "Joining…" : "Join lobby"}
              </button>
            ) : (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="btn btn-primary"
                style={{ padding: "10px 24px", textDecoration: "none", display: "inline-block" }}
              >
                Log in to join
              </Link>
            )}
            {t.status !== "registration" ? (
              <span style={{ fontSize: "13px", color: "var(--text-muted)", alignSelf: "center" }}>
                Registration is only open when status is &quot;registration&quot;.
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
