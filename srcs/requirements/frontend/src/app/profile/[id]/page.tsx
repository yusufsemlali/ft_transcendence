"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api/api";
import { User, Friend } from "@ft-transcendence/contracts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/lib/store/hooks";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: me } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState<Friend | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch user data
        const userRes = await api.users.getUserById({ params: { id } });
        if (userRes.status === 200) {
          setUser(userRes.body);
        } else {
          toast.error("User not found");
          return;
        }

        // Fetch relationship status if not "me"
        if (me && me.id !== id) {
           const res = await api.friends.getFriendship({ params: { userId: id } });
           if (res.status === 200) {
             setFriendship(res.body);
           }
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id, me]);

  const handleAddFriend = async () => {
    try {
      const res = await api.friends.sendFriendRequest({ body: { targetUserId: id } });
      if (res.status === 201) {
        toast.success("Friend request sent!");
        const relRes = await api.friends.getFriendship({ params: { userId: id } });
        if (relRes.status === 200) setFriendship(relRes.body);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = (res.body as any)?.message || "Failed to send request";
        toast.error(msg);
      }
    } catch {
      toast.error("Failed to send request");
    }
  };

  const handleOpenDM = () => {
    if (!user || !me) return;
    const sorted = [me.username, user.username].sort((a, b) => a.localeCompare(b));
    const roomSlug = `dm-${sorted[0]}-${sorted[1]}`;
    router.push(`/chat?room=${encodeURIComponent(roomSlug)}`);
  };

  if (loading) {
    return (
      <div className="page animate-pulse">
        <header style={{ marginBottom: "48px" }}>
          <Skeleton className="h-10 w-64" />
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))", gap: "24px" }}>
            <Skeleton className="h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) return <div className="page text-center py-20 font-mono text-muted-foreground">USER_NOT_FOUND_404</div>;

  const isMe = me?.id === user.id;
  const isAccepted = friendship?.status === "accepted";
  const isPending = friendship?.status === "pending";
  const isOutgoing = isPending && friendship?.senderId === me?.id;
  const isIncoming = isPending && friendship?.senderId !== me?.id;
  const isBlocked = friendship?.status === "blocked";

  return (
    <div className="page animate-fade-in" style={{ paddingBottom: "4rem" }}>
      
      {/* Header — Same as Settings */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "48px",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "300", margin: 0 }}>
          {isMe ? "Your Profile" : "User Profile"}
        </h1>
        <div className="glass" style={{
          padding: "8px 16px",
          borderRadius: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid var(--border-color)",
        }}>
          <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "20px" }}>person</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
            {user.username}
          </span>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))", gap: "24px" }}>
        
        {/* Identity & Interaction Column */}
        <div className="stack-md">
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>account_circle</span>
              <span className="section-title">IDENTITY</span>
            </div>

            <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "32px" }}>
              <div className="relative">
                <div style={{ 
                  width: "100px", 
                  height: "100px", 
                  borderRadius: "50%", 
                  border: "2px solid var(--border-color)", 
                  padding: "4px",
                  background: "var(--bg-secondary)" 
                }}>
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.username} width={92} height={92} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-full">
                      <span className="material-symbols-outlined text-3xl opacity-20">person</span>
                    </div>
                  )}
                </div>
                {user.isOnline && (
                  <div style={{ 
                    position: "absolute", bottom: "4px", right: "4px", 
                    width: "16px", height: "16px", borderRadius: "50%", 
                    background: "var(--accent-success)", border: "3px solid var(--bg-primary)" 
                  }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em" }}>{user.displayName || user.username}</div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>@{user.username}</div>
                <div style={{ fontSize: "12px", color: "var(--primary)", marginTop: "4px", fontWeight: "600", fontStyle: "italic" }}>{user.tagline || String.raw`// NO_TAGLINE_SET`}</div>
              </div>
            </div>

            <div className="stack-sm">
               {!isMe && me && (
                 <div style={{ display: "flex", gap: "12px" }}>
                    {isAccepted ? (
                      <button onClick={handleOpenDM} className="btn btn-primary" style={{ flex: 1 }}>
                        <span className="material-symbols-outlined mr-2">chat</span>
                        Message
                      </button>
                    ) : isOutgoing ? (
                      <button disabled className="btn btn-secondary" style={{ flex: 1, opacity: 0.5 }}>
                        <span className="material-symbols-outlined mr-2">send</span>
                        Request Pending
                      </button>
                    ) : isIncoming ? (
                      <button onClick={() => router.push("/friends")} className="btn btn-primary" style={{ flex: 1, background: "var(--accent-info)" }}>
                        <span className="material-symbols-outlined mr-2">priority_high</span>
                        Review Request
                      </button>
                    ) : isBlocked ? (
                       <div className="btn btn-ghost" style={{ flex: 1, color: "var(--destructive-foreground)", pointerEvents: "none" }}>BLOCKED</div>
                    ) : (
                      <button onClick={handleAddFriend} className="btn btn-primary" style={{ flex: 1 }}>
                        <span className="material-symbols-outlined mr-2">person_add</span>
                        Add Friend
                      </button>
                    )}
                 </div>
               )}
               {isMe && (
                 <button onClick={() => router.push("/account-settings")} className="btn btn-secondary" style={{ width: "100%" }}>
                    <span className="material-symbols-outlined mr-2">settings</span>
                    Edit Profile
                 </button>
               )}
            </div>
          </section>

          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>analytics</span>
              <span className="section-title">PERFORMANCE METRICS</span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
               {[
                 { label: "ELO RATE", value: user.eloRating || 1200, icon: "military_tech" },
                 { label: "RANK LVL", value: user.level || 1, icon: "grade" },
                 { label: "TOTAL WINS", value: "0", icon: "emoji_events" },
                 { label: "WIN RATIO", value: "0%", icon: "trending_up" },
               ].map((m) => (
                 <div key={m.label} style={{ padding: "20px", borderRadius: "var(--radius)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                       <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>{m.icon}</span>
                       <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "1px" }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "900", fontFamily: "var(--font-mono)" }}>{m.value}</div>
                 </div>
               ))}
            </div>
          </section>
        </div>

        {/* Details & Logs Column */}
        <div className="stack-md">
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>description</span>
              <span className="section-title">BIOGRAPHY</span>
            </div>
            <p style={{ 
              fontSize: "14px", 
              lineHeight: "1.6", 
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap" 
            }}>
              {user.bio || String.raw`// This system agent has not yet initialized its biography protocol.`}
            </p>
          </section>

          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>terminal</span>
              <span className="section-title">SYSTEM LOGS</span>
            </div>
            <div className="stack-sm">
               {[
                 { label: "Registry Date", value: new Date(user.createdAt).toLocaleDateString() },
                 { label: "Global Alias", value: `@${user.username}` },
                 { label: "Status Flag", value: user.isOnline ? "ONLINE" : "OFFLINE" },
               ].map((l) => (
                 <div key={l.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>{l.label.toUpperCase()}</span>
                    <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: "700" }}>{l.value}</span>
                 </div>
               ))}
            </div>
          </section>

          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "20px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>history</span>
              <span className="section-title">RECENT ACTIVITY</span>
            </div>
            <div style={{ 
              padding: "40px 20px", 
              textAlign: "center", 
              borderRadius: "var(--radius)", 
              border: "1px dashed var(--border-color)",
              color: "var(--text-muted)",
              fontSize: "12px"
            }}>
               <span className="material-symbols-outlined" style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.2 }}>hourglass_empty</span>
               <div style={{ letterSpacing: "1px", fontWeight: "600" }}>SYNCING_ACTIVITY_DATA…</div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
