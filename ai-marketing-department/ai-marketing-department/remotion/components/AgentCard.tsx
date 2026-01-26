import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { departmentColors, statusColors } from "../utils/colors";
import type { Agent } from "../utils/agentData";

interface AgentCardProps {
  agent: Agent;
  startFrame?: number;
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
}

const sizeConfig = {
  sm: { width: 180, height: 60, fontSize: 12, iconSize: 16, padding: 10 },
  md: { width: 220, height: 70, fontSize: 14, iconSize: 20, padding: 14 },
  lg: { width: 280, height: 90, fontSize: 18, iconSize: 28, padding: 18 },
};

const RoleIcon: React.FC<{ role: string; size: number; color: string }> = ({ role, size, color }) => {
  if (role === "cmo") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
      </svg>
    );
  }
  if (role === "director") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
};

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  startFrame = 0,
  size = "md",
  showGlow = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const config = sizeConfig[size];
  const colors = departmentColors[agent.department as keyof typeof departmentColors] || departmentColors.content;
  const statusColor = statusColors[agent.status as keyof typeof statusColors] || statusColors.active;

  // Entrance animation
  const scale = spring({
    fps,
    frame: frame - startFrame,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 20,
  });

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow pulse animation
  const glowOpacity = showGlow
    ? interpolate(Math.sin((frame / 20) * Math.PI * 2), [-1, 1], [0.2, 0.6])
    : 0;

  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.primary}40`,
        borderRadius: 12,
        padding: config.padding,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity,
        transform: `scale(${scale})`,
        position: "relative",
        boxShadow: showGlow ? `0 0 30px ${colors.glow}` : "none",
      }}
    >
      {/* Glow overlay */}
      {showGlow && (
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: 14,
            border: `2px solid ${colors.primary}`,
            opacity: glowOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Status indicator */}
      <div
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: statusColor,
          border: "2px solid #0a0a0a",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: config.iconSize + 16,
          height: config.iconSize + 16,
          borderRadius: 8,
          backgroundColor: colors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RoleIcon role={agent.role} size={config.iconSize} color={colors.primary} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: config.fontSize,
            fontWeight: 600,
            color: "white",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {agent.name}
        </div>
        <div
          style={{
            fontSize: config.fontSize - 2,
            color: "#71717a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {agent.agentId}
        </div>
      </div>
    </div>
  );
};
