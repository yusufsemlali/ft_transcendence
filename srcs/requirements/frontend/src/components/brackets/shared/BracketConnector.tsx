"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ConnectorLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface BracketConnectorProps {
    containerRef: React.RefObject<HTMLElement | null>;
    matchRefs: React.RefObject<Map<string, HTMLElement>>;
    connections: Array<{ fromId: string; toId: string }>;
}

export function BracketConnector({
    containerRef,
    matchRefs,
    connections,
}: BracketConnectorProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [lines, setLines] = useState<ConnectorLine[]>([]);
    const [dims, setDims] = useState({ width: 0, height: 0 });

    const computeLines = useCallback(() => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const scrollTop = containerRef.current.scrollTop;

        setDims({
            width: containerRef.current.scrollWidth,
            height: containerRef.current.scrollHeight,
        });

        const newLines: ConnectorLine[] = [];
        for (const { fromId, toId } of connections) {
            const fromEl = matchRefs.current.get(fromId);
            const toEl = matchRefs.current.get(toId);
            if (!fromEl || !toEl) continue;

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            const x1 = fromRect.right - containerRect.left + scrollLeft;
            const y1 = fromRect.top + fromRect.height / 2 - containerRect.top + scrollTop;
            const x2 = toRect.left - containerRect.left + scrollLeft;
            const y2 = toRect.top + toRect.height / 2 - containerRect.top + scrollTop;

            newLines.push({ x1, y1, x2, y2 });
        }
        setLines(newLines);
    }, [containerRef, matchRefs, connections]);

    useEffect(() => {
        computeLines();
        const observer = new ResizeObserver(computeLines);
        if (containerRef.current) observer.observe(containerRef.current);
        window.addEventListener("resize", computeLines);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", computeLines);
        };
    }, [computeLines, containerRef]);

    if (lines.length === 0) return null;

    return (
        <svg
            ref={svgRef}
            className="absolute top-0 left-0 pointer-events-none"
            width={dims.width}
            height={dims.height}
            style={{ zIndex: 0 }}
        >
            {lines.map((line, i) => {
                const midX = (line.x1 + line.x2) / 2;
                return (
                    <path
                        key={i}
                        d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                        fill="none"
                        stroke="var(--border-color)"
                        strokeWidth={1}
                        strokeOpacity={0.6}
                    />
                );
            })}
        </svg>
    );
}
