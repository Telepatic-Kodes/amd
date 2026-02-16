"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface HandoffEdge {
  fromAgentId: string;
  toAgentId: string;
  count: number;
  lastTimestamp: number;
}

interface HandoffOverlayProps {
  edges: HandoffEdge[];
  positions: Map<string, DOMRect>;
  containerRect: DOMRect | null;
  hoveredAgentId: string | null;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HandoffOverlay({ edges, positions, containerRect, hoveredAgentId }: HandoffOverlayProps) {
  const [tooltipEdge, setTooltipEdge] = useState<{ edge: HandoffEdge; x: number; y: number } | null>(null);

  const paths = useMemo(() => {
    if (!containerRect) return [];

    return edges
      .map((edge) => {
        const fromRect = positions.get(edge.fromAgentId);
        const toRect = positions.get(edge.toAgentId);
        if (!fromRect || !toRect) return null;

        // Bottom-center of source
        const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
        const y1 = fromRect.bottom - containerRect.top;

        // Top-center of target
        const x2 = toRect.left + toRect.width / 2 - containerRect.left;
        const y2 = toRect.top - containerRect.top;

        // Bezier control points
        const dy = Math.abs(y2 - y1);
        const cpOffset = Math.max(dy * 0.4, 30);
        const d = `M ${x1} ${y1} C ${x1} ${y1 + cpOffset}, ${x2} ${y2 - cpOffset}, ${x2} ${y2}`;

        // Stroke width proportional to count
        const strokeWidth = Math.min(1.5 + Math.log2(Math.max(edge.count, 1)) * 0.8, 4);

        // Opacity based on hover state
        let opacity = 0.4;
        if (hoveredAgentId) {
          const isConnected = edge.fromAgentId === hoveredAgentId || edge.toAgentId === hoveredAgentId;
          opacity = isConnected ? 0.5 : 0.08;
        }

        // Midpoint for tooltip positioning
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        return {
          edge,
          d,
          strokeWidth,
          opacity,
          midX,
          midY,
        };
      })
      .filter(Boolean) as Array<{
      edge: HandoffEdge;
      d: string;
      strokeWidth: number;
      opacity: number;
      midX: number;
      midY: number;
    }>;
  }, [edges, positions, containerRect, hoveredAgentId]);

  if (!containerRect || paths.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill="var(--accent)"
            opacity="0.6"
          />
        </marker>
      </defs>

      {paths.map((p, i) => (
        <g key={`${p.edge.fromAgentId}-${p.edge.toAgentId}-${i}`}>
          {/* Invisible wider hit area for hover */}
          <path
            d={p.d}
            fill="none"
            stroke="transparent"
            strokeWidth={Math.max(p.strokeWidth * 4, 12)}
            className="pointer-events-auto cursor-pointer"
            onMouseEnter={(e) => {
              const svgRect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              setTooltipEdge({
                edge: p.edge,
                x: e.clientX - svgRect.left,
                y: e.clientY - svgRect.top,
              });
            }}
            onMouseLeave={() => setTooltipEdge(null)}
          />

          {/* Visible path */}
          <motion.path
            d={p.d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={p.strokeWidth}
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
            opacity={p.opacity}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
            strokeDasharray="6 4"
            style={{
              // @ts-expect-error CSS custom property for dash animation
              "--dash-offset": "0",
            }}
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-20"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </motion.path>
        </g>
      ))}

      {/* Tooltip */}
      {tooltipEdge && (
        <g>
          <rect
            x={tooltipEdge.x - 80}
            y={tooltipEdge.y - 36}
            width="160"
            height="28"
            rx="6"
            fill="var(--card-bg)"
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text
            x={tooltipEdge.x}
            y={tooltipEdge.y - 18}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontFamily="system-ui, sans-serif"
          >
            {tooltipEdge.edge.fromAgentId} → {tooltipEdge.edge.toAgentId}: {tooltipEdge.edge.count} handoffs · {formatTimeAgo(tooltipEdge.edge.lastTimestamp)}
          </text>
        </g>
      )}
    </svg>
  );
}
