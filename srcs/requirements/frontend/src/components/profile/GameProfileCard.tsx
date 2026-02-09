"use client";

import { GameProfile, SupportedGame } from "@ft-transcendence/contracts";

interface GameProfileCardProps {
  profile: GameProfile;
  isOwner: boolean;
  onDelete?: (game: SupportedGame) => void;
  onEdit?: (game: SupportedGame) => void;
}

export function GameProfileCard({
  profile,
  isOwner,
  onDelete,
  onEdit,
}: GameProfileCardProps) {
  const { game, gameIdentifier, rank, level, isVerified, metadata } = profile;

  // Define visual themes per game
  const styles: Record<string, { bg: string; accent: string; icon: string }> = {
    league_of_legends: {
      bg: "linear-gradient(135deg, rgba(8,20,40,0.9) 0%, rgba(10,50,60,0.8) 100%)",
      accent: "#C89B3C", // Hextech Gold
      icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", // Layered shield/diamond thing
    },
    cs2: {
      bg: "linear-gradient(135deg, rgba(30,30,35,0.9) 0%, rgba(60,60,65,0.8) 100%)",
      accent: "#DE9B35", // Terrorist Orange
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z", // Exclamation/target
    },
    valorant: {
      bg: "linear-gradient(135deg, rgba(20,20,30,0.9) 0%, rgba(255,70,85,0.2) 100%)",
      accent: "#FF4655", // Valorant Red
      icon: "M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z", // Triangle/V
    },
    apex_legends: {
      bg: "linear-gradient(135deg, rgba(20,10,10,0.9) 0%, rgba(180,50,50,0.2) 100%)",
      accent: "#DA292A", // Apex Red
      icon: "M12 2l-5.5 9h11L12 2zm0 13l-3.5 6h7L12 15z", // A shape
    },
    dota2: {
      bg: "linear-gradient(135deg, rgba(40,10,10,0.9) 0%, rgba(80,20,20,0.8) 100%)",
      accent: "#BE3A2B", // Radiant Red/Dire
      icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z", // Square map
    },
    overwatch2: {
      bg: "linear-gradient(135deg, rgba(240,100,20,0.1) 0%, rgba(255,255,255,0.1) 100%)",
      accent: "#F06414", // OW Orange
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z", // Circle/logo
    },
  };

  const style = styles[game] || {
    bg: "rgba(30,30,30,0.8)",
    accent: "#ffffff",
    icon: "",
  };

  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg border border-white/5 relative group transition hover:-translate-y-1 hover:shadow-xl"
      style={{ background: style.bg }}
    >
      {/* Header/Title */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{ color: style.accent }}
          >
            <path d={style.icon} />
          </svg>
          <span
            className="font-bold uppercase tracking-wider text-sm"
            style={{ color: style.accent }}
          >
            {game.replace(/_/g, " ")}
          </span>
        </div>
        {isVerified && (
          <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded border border-green-500/20">
            Verified
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <div className="text-gray-400 text-xs uppercase tracking-wide">
            Identity
          </div>
          <div
            className="text-xl font-mono font-bold text-white truncate"
            title={gameIdentifier}
          >
            {gameIdentifier}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-wide">
              Rank
            </div>
            <div className="text-white font-medium">{rank || "Unranked"}</div>
          </div>
          {level && (
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide">
                Level
              </div>
              <div className="text-white font-medium">{level}</div>
            </div>
          )}
        </div>

        {/* Metadata Display (Specific Stats) */}
        {Object.keys(metadata).length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">
              Stats
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-gray-500 text-xs">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-gray-300 font-mono">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions overlay (only for owner) */}
      {isOwner && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          {onEdit && (
            <button
              onClick={() => onEdit(game as SupportedGame)}
              className="bg-black/50 hover:bg-white/10 text-white p-1.5 rounded transition backdrop-blur-sm"
              title="Edit Profile"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(game as SupportedGame)}
              className="bg-black/50 hover:bg-red-500/20 text-red-400 p-1.5 rounded transition backdrop-blur-sm"
              title="Unlink Account"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
