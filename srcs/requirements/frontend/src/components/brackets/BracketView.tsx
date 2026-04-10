"use client";

import { cn } from "@/lib/utils";
import { SingleEliminationBracket } from "./single-elimination/SingleEliminationBracket";
import { DoubleEliminationBracket } from "./double-elimination/DoubleEliminationBracket";
import { RoundRobinBracket } from "./round-robin/RoundRobinBracket";
import { SwissBracket } from "./swiss/SwissBracket";
import { FreeForAllBracket } from "./free-for-all/FreeForAllBracket";
import type { BracketViewProps } from "./types";

const RENDERERS: Record<string, React.ComponentType<BracketViewProps>> = {
    single_elimination: SingleEliminationBracket,
    double_elimination: DoubleEliminationBracket,
    round_robin: RoundRobinBracket,
    swiss: SwissBracket,
    free_for_all: FreeForAllBracket,
};

export function BracketView(props: BracketViewProps) {
    const Renderer = RENDERERS[props.data.bracketType];

    if (!Renderer) {
        return (
            <div className={cn("ds-empty-state", props.className)}>
                Unsupported bracket type: {props.data.bracketType}
            </div>
        );
    }

    if (props.data.rounds.length === 0) {
        return (
            <div className={cn("ds-empty-state", props.className)}>
                <span
                    className="material-symbols-outlined text-muted-foreground/30"
                    style={{ fontSize: "48px" }}
                >
                    account_tree
                </span>
                <p className="mt-4 text-sm text-muted-foreground">
                    Bracket has not been generated yet.
                </p>
            </div>
        );
    }

    return (
        <div className="bracket-outer">
            <Renderer {...props} />
        </div>
    );
}
