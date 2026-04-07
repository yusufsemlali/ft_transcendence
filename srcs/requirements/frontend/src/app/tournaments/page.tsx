"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import api from "@/lib/api/api";
import type { PublicTournament } from "@ft-transcendence/contracts";
import Link from "next/link";

export default function TournamentsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [tournaments, setTournaments] = useState<PublicTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await api.tournaments.getTournaments({ query: { page: 1, pageSize: 50 } });
        if (response.status === 200) {
          setTournaments(response.body.tournaments);
        } else {
          setError("Failed to fetch tournaments");
        }
      } catch (err) {
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  const filters = ["All", "draft", "registration", "upcoming", "ongoing", "completed", "cancelled"];

  const filteredTournaments =
    activeFilter === "All"
      ? tournaments
      : tournaments.filter((t) => t.status === activeFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return { bg: "color-mix(in srgb, var(--accent-error), transparent 90%)", color: "var(--accent-error)" };
      case "registration":
        return { bg: "color-mix(in srgb, var(--accent-success), transparent 90%)", color: "var(--accent-success)" };
      case "upcoming":
        return { bg: "color-mix(in srgb, var(--accent-warning), transparent 90%)", color: "var(--accent-warning)" };
      default:
        return { bg: "color-mix(in srgb, var(--text-muted), transparent 90%)", color: "var(--text-muted)" };
    }
  };

  return (
    <div className="page" style={{
      minHeight: "100vh",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      backgroundColor: "transparent",
    }}>
        {/* Header Row */}
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
              type="text"
              placeholder="Search tournaments..."
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

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "32px",
            overflowX: "auto",
            paddingBottom: "10px",
            scrollbarWidth: "none",
          }}
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={
                activeFilter === filter
                  ? "btn btn-primary"
                  : "btn btn-secondary"
              }
              style={{
                borderRadius: "20px",
                padding: "6px 18px",
                fontSize: "13px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                textTransform: "capitalize",
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && <div style={{ textAlign: "center", opacity: 0.5 }}>Loading tournaments...</div>}
        {error && <div style={{ color: "var(--accent-error)", textAlign: "center" }}>{error}</div>}

        {/* Grid */}
        {!loading && !error && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
              gap: "24px",
            }}
          >
            {filteredTournaments.map((t) => {
              const statusStyles = getStatusColor(t.status);
              
              return (
                <div
                  key={t.id}
                  className="glass-card"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    border: "1px solid var(--border-color)",
                    transition: "transform 0.2s ease, border-color 0.2s ease",
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
                      alt={t.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.8,
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

                    <div
                      style={{ position: "absolute", top: "10px", right: "10px" }}
                    >
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
                          letterSpacing: "1px"
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--accent-info)",
                          fontWeight: "600",
                          textTransform: "uppercase"
                        }}
                      >
                        {t.mode}
                      </span>
                      <span
                        style={{ fontSize: "10px", color: "var(--text-muted)" }}
                      >
                        {t.minTeamSize === t.maxTeamSize ? `${t.minTeamSize}v${t.maxTeamSize}` : `${t.minTeamSize}-${t.maxTeamSize} Players`}
                      </span>
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {t.name}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginTop: "auto",
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
                        {t.prizePool || "None"}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}

            <Link href="/tournaments/create" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  border: "1px dashed var(--border-color)",
                  borderRadius: "16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "300px",
                  color: "var(--text-muted)",
                  gap: "10px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease, color 0.2s ease",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "32px" }}
                >
                  add_circle
                </span>
                <span style={{ fontSize: "14px" }}>Create Tournament</span>
              </div>
            </Link>
          </div>
        )}
    </div>
  );
}
