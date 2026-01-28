import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { GlowingLine } from "../components/GlowingLine";
import { departmentColors, departmentLabels } from "../utils/colors";

interface WorkflowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  size?: "lg" | "md" | "sm";
}

export const WorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Layout calculations
  const centerX = width / 2;
  const padding = 100;
  const usableWidth = width - padding * 2;

  // Row Y positions
  const row1Y = 160;  // CMO
  const row2Y = 340;  // Directors
  const row3Y = 520;  // Outputs
  const row4Y = 700;  // Results

  // Department spacing
  const deptCount = 6;
  const deptSpacing = usableWidth / deptCount;

  // Define workflow nodes with calculated positions
  const nodes: WorkflowNode[] = [
    // CMO - Top center
    { id: "cmo", label: "CMO Agent", x: centerX, y: row1Y, color: departmentColors.leadership.primary, size: "lg" },

    // Directors - Row 2
    { id: "content", label: "Content", x: padding + deptSpacing * 0.5, y: row2Y, color: departmentColors.content.primary, size: "md" },
    { id: "social", label: "Social", x: padding + deptSpacing * 1.5, y: row2Y, color: departmentColors.social.primary, size: "md" },
    { id: "demandgen", label: "Demand Gen", x: padding + deptSpacing * 2.5, y: row2Y, color: departmentColors.demandgen.primary, size: "md" },
    { id: "seo", label: "SEO", x: padding + deptSpacing * 3.5, y: row2Y, color: departmentColors.seo.primary, size: "md" },
    { id: "brand", label: "Brand", x: padding + deptSpacing * 4.5, y: row2Y, color: departmentColors.brand.primary, size: "md" },
    { id: "ops", label: "Ops", x: padding + deptSpacing * 5.5, y: row2Y, color: departmentColors.ops.primary, size: "md" },

    // Outputs - Row 3
    { id: "blog", label: "Blog Posts", x: padding + deptSpacing * 0.5, y: row3Y, color: departmentColors.content.primary, size: "sm" },
    { id: "linkedin", label: "Social Posts", x: padding + deptSpacing * 1.5, y: row3Y, color: departmentColors.social.primary, size: "sm" },
    { id: "ads", label: "Ad Campaigns", x: padding + deptSpacing * 2.5, y: row3Y, color: departmentColors.demandgen.primary, size: "sm" },
    { id: "rankings", label: "SEO Rankings", x: padding + deptSpacing * 3.5, y: row3Y, color: departmentColors.seo.primary, size: "sm" },
    { id: "assets", label: "Creative Assets", x: padding + deptSpacing * 4.5, y: row3Y, color: departmentColors.brand.primary, size: "sm" },
    { id: "emails", label: "Email Campaigns", x: padding + deptSpacing * 5.5, y: row3Y, color: departmentColors.ops.primary, size: "sm" },

    // Results - Bottom center
    { id: "results", label: "Marketing Results", x: centerX, y: row4Y, color: "#22c55e", size: "lg" },
  ];

  // Connections between nodes
  const connections = [
    // CMO to directors
    { from: "cmo", to: "content", delay: 0 },
    { from: "cmo", to: "social", delay: 3 },
    { from: "cmo", to: "demandgen", delay: 6 },
    { from: "cmo", to: "seo", delay: 9 },
    { from: "cmo", to: "brand", delay: 12 },
    { from: "cmo", to: "ops", delay: 15 },
    // Directors to outputs
    { from: "content", to: "blog", delay: 30 },
    { from: "social", to: "linkedin", delay: 33 },
    { from: "demandgen", to: "ads", delay: 36 },
    { from: "seo", to: "rankings", delay: 39 },
    { from: "brand", to: "assets", delay: 42 },
    { from: "ops", to: "emails", delay: 45 },
    // Outputs to results
    { from: "blog", to: "results", delay: 60 },
    { from: "linkedin", to: "results", delay: 63 },
    { from: "ads", to: "results", delay: 66 },
    { from: "rankings", to: "results", delay: 69 },
    { from: "assets", to: "results", delay: 72 },
    { from: "emails", to: "results", delay: 75 },
  ];

  // Background opacity
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title animation
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [10, 35], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const getNode = (id: string) => nodes.find((n) => n.id === id)!;

  // Node size mappings
  const nodeSizes = {
    lg: { padding: "16px 32px", fontSize: 20, nodeHeight: 50 },
    md: { padding: "12px 20px", fontSize: 14, nodeHeight: 40 },
    sm: { padding: "8px 16px", fontSize: 12, nodeHeight: 32 },
  };

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#0a0a0a",
        position: "relative",
        opacity: bgOpacity,
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(ellipse at center, rgba(34, 197, 94, 0.05) 0%, transparent 60%)",
        }}
      />

      {/* Title */}
      <h2
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 48,
          fontWeight: 700,
          background: "linear-gradient(135deg, white 0%, #a1a1aa 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          margin: 0,
        }}
      >
        Automated Workflow
      </h2>
      <p
        style={{
          position: "absolute",
          top: 105,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 18,
          color: "#71717a",
          opacity: titleOpacity,
          margin: 0,
        }}
      >
        From Strategy to Results
      </p>

      {/* SVG for connections */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        {connections.map((conn, index) => {
          const fromNode = getNode(conn.from);
          const toNode = getNode(conn.to);
          const fromSize = nodeSizes[fromNode.size || "md"];
          const toSize = nodeSizes[toNode.size || "md"];

          return (
            <GlowingLine
              key={index}
              x1={fromNode.x}
              y1={fromNode.y + fromSize.nodeHeight / 2}
              x2={toNode.x}
              y2={toNode.y - toSize.nodeHeight / 2}
              color={fromNode.color}
              startFrame={25 + conn.delay}
              duration={20}
              showPulse={frame > 120}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, index) => {
        const size = nodeSizes[node.size || "md"];
        const nodeDelay = index * 2;
        const nodeOpacity = interpolate(
          frame,
          [15 + nodeDelay, 35 + nodeDelay],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const nodeScale = interpolate(
          frame,
          [15 + nodeDelay, 40 + nodeDelay],
          [0.8, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(1.2)),
          }
        );

        // Pulse effect for active nodes
        const pulseScale = frame > 120
          ? 1 + Math.sin((frame / 25 + index) * Math.PI * 2) * 0.03
          : 1;

        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              transform: `translate(-50%, -50%) scale(${nodeScale * pulseScale})`,
              opacity: nodeOpacity,
            }}
          >
            <div
              style={{
                padding: size.padding,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${node.color}15, ${node.color}08)`,
                border: `1px solid ${node.color}40`,
                boxShadow: frame > 120 ? `0 0 30px ${node.color}20` : "none",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: size.fontSize,
                  fontWeight: 600,
                  color: node.color,
                }}
              >
                {node.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Data flow particles */}
      {frame > 100 &&
        [0, 1, 2, 3, 4, 5].map((i) => {
          const particleProgress = ((frame - 100 + i * 25) % 150) / 150;
          const startY = row2Y;
          const endY = row4Y - 30;
          const y = startY + (endY - startY) * particleProgress;
          const x = padding + deptSpacing * (i + 0.5);
          const opacity = Math.sin(particleProgress * Math.PI) * 0.8;
          const colors = [
            departmentColors.content.primary,
            departmentColors.social.primary,
            departmentColors.demandgen.primary,
            departmentColors.seo.primary,
            departmentColors.brand.primary,
            departmentColors.ops.primary,
          ];

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: colors[i],
                boxShadow: `0 0 20px ${colors[i]}`,
                opacity,
                transform: "translate(-50%, -50%)",
              }}
            />
          );
        })}

      {/* Bottom label */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [150, 180], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span
          style={{
            fontSize: 16,
            color: "#71717a",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Continuous • Automated • 24/7
        </span>
      </div>
    </div>
  );
};
