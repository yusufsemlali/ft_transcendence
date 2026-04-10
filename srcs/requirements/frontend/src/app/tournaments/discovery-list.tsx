"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchDiscoveryThunk } from "@/lib/store/tournamentSlice";
import api from "@/lib/api/api";
import {
  TOURNAMENT_DISCOVERY_STATUSES,
  type Sport,
} from "@ft-transcendence/contracts";
import { toastApiError } from "@/lib/api-error";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const DEFAULT_PAGE_SIZE = 12;

function readDiscoveryQuery(sp: URLSearchParams) {
  const page = Math.max(1, Number(sp.get("page") || "1") || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(sp.get("pageSize") || String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE),
  );
  const q = (sp.get("q") || "").trim();
  const sportId = sp.get("sportId") || undefined;
  const statusRaw = sp.get("status") || "";
  const status = TOURNAMENT_DISCOVERY_STATUSES.includes(
    statusRaw as (typeof TOURNAMENT_DISCOVERY_STATUSES)[number],
  )
    ? (statusRaw as (typeof TOURNAMENT_DISCOVERY_STATUSES)[number])
    : undefined;
  return { page, pageSize, q, sportId, status };
}

function getStatusStyles(status: string) {
  switch (status) {
    case "ongoing":
      return {
        bg: "color-mix(in srgb, var(--accent-error), transparent 90%)",
        color: "var(--accent-error)",
      };
    case "registration":
      return {
        bg: "color-mix(in srgb, var(--accent-success), transparent 90%)",
        color: "var(--accent-success)",
      };
    case "upcoming":
      return {
        bg: "color-mix(in srgb, var(--accent-warning), transparent 90%)",
        color: "var(--accent-warning)",
      };
    default:
      return {
        bg: "color-mix(in srgb, var(--text-muted), transparent 90%)",
        color: "var(--text-muted)",
      };
  }
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function DiscoveryList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { page, pageSize, q, sportId, status } = useMemo(
    () => readDiscoveryQuery(searchParams),
    [searchParams],
  );

  const [searchDraft, setSearchDraft] = useState(q);

  useEffect(() => {
    setSearchDraft(q);
  }, [q]);

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === undefined || val === "") next.delete(key);
        else next.set(key, val);
      }
      router.replace(`/tournaments?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft === q) return;
      setParams({ q: searchDraft.trim() || undefined, page: "1" });
    }, 400);
    return () => clearTimeout(t);
  }, [searchDraft, q, setParams]);

  const dispatch = useAppDispatch();
  const { items: tournaments, isLoading: loading, error, totalPages } = useAppSelector(s => s.tournament.discovery);

  const fetchDiscovery = useCallback(() => {
    dispatch(fetchDiscoveryThunk({
      page,
      pageSize,
      search: q || undefined,
      sportId,
      status,
    }));
  }, [dispatch, page, pageSize, q, sportId, status]);

  useEffect(() => {
    fetchDiscovery();
  }, [fetchDiscovery]);

  /* ── Real-time Hydration (SSE) ── */
  useEffect(() => {
    const streamUrl = `${process.env.NEXT_PUBLIC_API_URL || "/api"}/tournaments/discovery/stream`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    eventSource.addEventListener("discovery_update", () => {
      fetchDiscovery();
    });

    return () => {
      eventSource.close();
    };
  }, [fetchDiscovery]);

  const sportsQuery = useQuery({
    queryKey: ["sports", "discovery"],
    queryFn: async () => {
      const res = await api.sports.getSports({});
      if (res.status !== 200) {
        toastApiError(res.body, "Failed to load sports");
        throw new Error("Failed to load sports");
      }
      return res.body as Sport[];
    },
  });

  const sports = sportsQuery.data ?? [];

  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <h1 style={{ fontSize: "36px", fontWeight: "300", margin: 0 }}>
          Browse Tournaments
        </h1>

        <div
          className="glass"
          style={{
            padding: "8px 16px",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "min(320px, 100%)",
            border: "1px solid var(--border-color)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--text-muted)", fontSize: "20px" }}
          >
            search
          </span>
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search by name or description…"
            aria-label="Search tournaments"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              outline: "none",
              fontSize: "14px",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "8px", alignItems: "center" }}>
          Sport
          <Select
            value={sportId ?? ""}
            onValueChange={(v) =>
              setParams({ sportId: v || undefined, page: "1" })
            }
          >
            <SelectTrigger style={{ minWidth: "160px", fontSize: "13px", padding: "6px 10px" }}>
              <SelectValue placeholder="All sports">
                {sportId && (() => {
                  const s = sports.find(sp => sp.id === sportId);
                  return s?.name ?? null;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All sports</SelectItem>
              {sports.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "8px", alignItems: "center" }}>
          Status
          <Select
            value={status ?? ""}
            onValueChange={(v) =>
              setParams({ status: v || undefined, page: "1" })
            }
          >
            <SelectTrigger style={{ minWidth: "160px", fontSize: "13px", padding: "6px 10px" }}>
              <SelectValue placeholder="All statuses">
                {status ? status.replace(/_/g, " ") : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {TOURNAMENT_DISCOVERY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && tournaments.length === 0 && (
        <div style={{ textAlign: "center", opacity: 0.6, padding: "48px" }}>
          Loading tournaments…
        </div>
      )}

      {error && !loading && tournaments.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--accent-error)" }}>
          {error}
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
            marginBottom: "24px",
          }}
        >
          <p style={{ margin: 0, fontSize: "15px" }}>
            {q || sportId || status
              ? "No tournaments match your filters."
              : "No public tournaments yet. Check back soon."}
          </p>
        </div>
      )}

      {tournaments.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
            gap: "24px",
            marginBottom: "32px",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          {tournaments.map((t) => {
            const statusStyles = getStatusStyles(t.status);
            const desc = t.description?.trim();
            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article
                  className="glass-card"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    border: "1px solid var(--border-color)",
                    transition: "transform 0.2s ease, border-color 0.2s ease",
                    height: "100%",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      height: "160px",
                      background: "var(--bg-tertiary)",
                      borderRadius: "8px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={t.bannerUrl || "/images/leage.jpeg"}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.85,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "60%",
                        background:
                          "linear-gradient(to top, var(--bg-primary), transparent)",
                      }}
                    />
                    <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: statusStyles.bg,
                          color: statusStyles.color,
                          borderColor: statusStyles.color,
                          border: "1px solid",
                          backdropFilter: "blur(4px)",
                          textTransform: "uppercase",
                          fontSize: "10px",
                          letterSpacing: "1px",
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ color: "var(--accent-info)", fontWeight: 600 }}>
                        {t.sportName}
                      </span>
                      <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
                      <span>{t.organizationName}</span>
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--accent-info)",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        {t.mode}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {t.minTeamSize === t.maxTeamSize
                          ? `${t.minTeamSize}v${t.maxTeamSize}`
                          : `${t.minTeamSize}–${t.maxTeamSize} per team`}
                      </span>
                    </div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        lineHeight: 1.25,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                      }}
                    >
                      {t.name}
                    </h2>
                    {desc ? (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          lineHeight: 1.45,
                        }}
                      >
                        {truncate(desc, 140)}
                      </p>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginTop: "auto",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          letterSpacing: "1px",
                        }}
                      >
                        PRIZE
                      </div>
                      <div
                        style={{
                          color: "var(--accent-success)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "16px",
                        }}
                      >
                        {t.prizePool || "—"}
                      </div>
                      {t.entryFee > 0 ? (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Entry {t.entryFee}
                        </div>
                      ) : null}
                    </div>
                    <span className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                      View
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setParams({ page: String(page - 1) })}
            style={{ fontSize: "12px" }}
          >
            Previous
          </button>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setParams({ page: String(page + 1) })}
            style={{ fontSize: "12px" }}
          >
            Next
          </button>
        </div>
      )}

      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <div
          style={{
            border: "1px dashed var(--border-color)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "120px",
            color: "var(--text-muted)",
            gap: "10px",
            cursor: "pointer",
            transition: "border-color 0.2s ease, color 0.2s ease",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>
            add_circle
          </span>
          <span style={{ fontSize: "14px" }}>Create tournament</span>
        </div>
      </Link>
    </div>
  );
}
