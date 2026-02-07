"use client";


/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export default function TournamentsPage() {
    const [activeFilter, setActiveFilter] = useState("All Games");

    const filters = ["All Games", "CS2", "League", "Apex", "Valorant", "Dota 2", "Overwatch"];

    const tournaments = [
        { id: 1, title: "Lunar New Year Cup", game: "League", prize: "$500", teamSize: "5v5", status: "Registration Open", image: "/leage.jpeg" },
        { id: 2, title: "FPS Weekly Rumble", game: "CS2", prize: "$100", teamSize: "5v5", status: "Live", image: "/cs2.jpeg" },
        { id: 3, title: "Apex Legends Trios", game: "Apex", prize: "$300", teamSize: "3v3", status: "Check-in", image: "/apex.jpeg" },
        { id: 4, title: "Valorant Spike Rush", game: "Valorant", prize: "$200", teamSize: "5v5", status: "Ended", image: "/val.jpeg" },
        { id: 5, title: "Mid-Lane 1v1", game: "League", prize: "$50", teamSize: "1v1", status: "Registration Open", image: "/leage.jpeg" },
        { id: 6, title: "Tactical Shooter", game: "CS2", prize: "$150", teamSize: "5v5", status: "Upcoming", image: "/cs2.jpeg" },
        { id: 7, title: "Dota 2 Masters", game: "Dota 2", prize: "$1000", teamSize: "5v5", status: "Registration Open", image: "/dota2.jpeg" },
        { id: 8, title: "Overwatch Open", game: "Overwatch", prize: "$400", teamSize: "5v5", status: "Live", image: "/overwatch.jpeg" },
    ];

    const filteredTournaments = activeFilter === "All Games"
        ? tournaments
        : tournaments.filter(t => t.game === activeFilter);

    return (
        <div style={{
            minHeight: "100vh",
            padding: "40px 20px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            backgroundColor: "transparent"
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "20px" }}>
                    <h1 style={{ fontSize: "36px", fontWeight: "300", margin: 0 }}>Browse Tournaments</h1>

                    <div className="glass" style={{
                        padding: "8px 16px",
                        borderRadius: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "320px",
                        border: "1px solid var(--border-color)"
                    }}>
                        <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "20px" }}>search</span>
                        <input
                            type="text"
                            placeholder="Search tournaments..."
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-primary)",
                                outline: "none",
                                fontSize: "14px",
                                width: "100%"
                            }}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "32px", overflowX: "auto", paddingBottom: "10px", scrollbarWidth: "none" }}>
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={activeFilter === filter ? "btn btn-primary" : "btn btn-secondary"}
                            style={{
                                borderRadius: "20px",
                                padding: "6px 18px",
                                fontSize: "13px",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Hero Feature Card */}
                <div className="glass-card" style={{
                    padding: "48px",
                    marginBottom: "40px",
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "400px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    border: "1px solid var(--border-color)"
                }}>
                    {/* Hero Background Image */}
                    <img
                        src="/leage.jpeg"
                        alt="Hero background"
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "60%",
                            height: "100%",
                            objectFit: "cover",
                            maskImage: "linear-gradient(to left, black 40%, transparent 100%)",
                            WebkitMaskImage: "linear-gradient(to left, black 40%, transparent 100%)",
                            opacity: 0.6,
                            zIndex: 0
                        }}
                    />

                    <div style={{ position: "relative", zIndex: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <span className="badge" style={{ backgroundColor: "var(--accent-secondary)", color: "white" }}>FEATURED</span>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span> Starts in 2 days
                            </span>
                        </div>

                        <h2 className="text-gradient" style={{ fontSize: "48px", fontWeight: "700", margin: "0 0 24px 0", lineHeight: "1.1" }}>
                            Winter Season<br />Championship
                        </h2>

                        <div style={{ display: "flex", gap: "40px", marginBottom: "32px", flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>PRIZE POOL</div>
                                <div style={{ fontSize: "24px", color: "var(--accent-success)", fontFamily: "var(--font-mono)" }}>$10,000</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>TEAMS</div>
                                <div style={{ fontSize: "24px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>16/32</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>FORMAT</div>
                                <div style={{ fontSize: "24px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>5v5</div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="btn btn-primary" style={{ padding: "10px 24px" }}>
                                Register Now <span className="material-symbols-outlined" style={{ fontSize: "16px", marginLeft: "4px" }}>arrow_forward</span>
                            </button>
                            <button className="btn btn-secondary" style={{ padding: "10px 24px" }}>View Details</button>
                        </div>
                    </div>

                    <div style={{
                        position: "absolute",
                        top: "-50%",
                        right: "-10%",
                        width: "600px",
                        height: "600px",
                        background: "radial-gradient(circle, color-mix(in srgb, var(--accent-primary), transparent 90%) 0%, transparent 70%)",
                        zIndex: 1
                    }} />
                </div>

                {/* Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "24px"
                }}>
                    {filteredTournaments.map(t => (
                        <div key={t.id} className="glass-card" style={{
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            border: "1px solid var(--border-color)",
                            transition: "transform 0.2s ease, border-color 0.2s ease",
                            cursor: "pointer"
                        }}>
                            <div style={{
                                height: "160px",
                                background: "var(--bg-tertiary)",
                                borderRadius: "8px",
                                position: "relative",
                                overflow: "hidden"
                            }}>
                                <img
                                    src={t.image}
                                    alt={t.title}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        opacity: 0.8
                                    }}
                                />
                                <div style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: "60%",
                                    background: "linear-gradient(to top, var(--bg-primary), transparent)"
                                }} />

                                <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                                    <span className="badge" style={{
                                        backgroundColor: t.status === "Live" ? "color-mix(in srgb, var(--accent-error), transparent 90%)" : "color-mix(in srgb, var(--accent-success), transparent 90%)",
                                        color: t.status === "Live" ? "var(--accent-error)" : "var(--accent-success)",
                                        borderColor: t.status === "Live" ? "var(--accent-error)" : "var(--accent-success)",
                                        border: "1px solid",
                                        backdropFilter: "blur(4px)"
                                    }}>
                                        {t.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "10px", color: "var(--accent-info)", fontWeight: "600" }}>{t.game}</span>
                                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{t.teamSize}</span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>{t.title}</h3>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
                                <div>
                                    <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px" }}>PRIZE</div>
                                    <div style={{ color: "var(--accent-success)", fontFamily: "var(--font-mono)", fontSize: "16px" }}>{t.prize}</div>
                                </div>
                                <button className="btn btn-secondary" style={{ padding: "4px 12px", fontSize: "12px" }}>View</button>
                            </div>
                        </div>
                    ))}

                    <div style={{
                        border: "1px dashed var(--border-color)",
                        borderRadius: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "300px",
                        color: "var(--text-muted)",
                        gap: "10px",
                        cursor: "pointer",
                        transition: "border-color 0.2s ease, color 0.2s ease"
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>add_circle</span>
                        <span style={{ fontSize: "14px" }}>Create Tournament</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
