"use client";

import { cn } from "@/lib/utils";

export interface RoundHeaderProps {
    roundNumber: number;
    label: string;
    align?: "center" | "left";
    /** Optional tertiary line (e.g. match count). */
    meta?: string;
    className?: string;
}

export function RoundHeader({
    roundNumber,
    label,
    align = "center",
    meta,
    className,
}: RoundHeaderProps) {
    return (
        <div
            className={cn(
                "round-header",
                align === "left" && "round-header--left",
                className,
            )}
        >
            <span className="round-header-count">Round {roundNumber}</span>
            <h3 className="round-header-label">{label}</h3>
            {meta != null && meta !== "" && (
                <span className="round-header-meta">{meta}</span>
            )}
        </div>
    );
}
