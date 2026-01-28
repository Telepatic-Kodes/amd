import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AgentCard } from "../components/AgentCard";
import { departmentColors, departmentLabels } from "../utils/colors";
import { getAgentsByDepartment } from "../utils/agentData";

interface DepartmentSceneProps {
  department: string;
  departmentName?: string;
  color?: string;
  bgColor?: string;
}

export const DepartmentScene: React.FC<DepartmentSceneProps> = ({
  department,
  departmentName,
  color,
  bgColor,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const agents = getAgentsByDepartment(department);
  const director = agents.find(a => a.role === "director");
  const specialists = agents.filter(a => a.role === "specialist");
  const colors = departmentColors[department as keyof typeof departmentColors] || departmentColors.content;
  const label = departmentName || departmentLabels[department] || department;
  const primaryColor = color || colors.primary;

  // Animations
  const sceneOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [5, 30], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Background glow animation
  const glowOpacity = interpolate(
    Math.sin((frame / 40) * Math.PI * 2),
    [-1, 1],
    [0.15, 0.3]
  );

  // Grid layout for specialists
  const cols = specialists.length <= 4 ? 2 : 3;
  const gridWidth = cols * 200 + (cols - 1) * 20;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
        opacity: sceneOpacity,
      }}
    >
      {/* Background gradient glow - top left */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}25 0%, transparent 60%)`,
          opacity: glowOpacity,
          filter: "blur(60px)",
        }}
      />

      {/* Background gradient glow - bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 60%)`,
          opacity: glowOpacity,
          filter: "blur(60px)",
        }}
      />

      {/* Header Section */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 6,
              height: 50,
              backgroundColor: primaryColor,
              borderRadius: 3,
            }}
          />
          <div style={{ textAlign: "left" }}>
            <h2
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: primaryColor,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {label}
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "#71717a",
                margin: 0,
                marginTop: 4,
              }}
            >
              {agents.length} AI Agents • Department Overview
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 100,
          right: 100,
          bottom: 140,
          display: "flex",
          gap: 60,
        }}
      >
        {/* Left Column - Director */}
        <div
          style={{
            flex: "0 0 320px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#71717a",
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: interpolate(frame, [15, 35], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Department Lead
          </div>
          {director && (
            <AgentCard agent={director} startFrame={25} size="lg" showGlow />
          )}

          {/* Quick Stats under Director */}
          <div
            style={{
              marginTop: 30,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              opacity: interpolate(frame, [50, 70], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${primaryColor}10, transparent)`,
                border: `1px solid ${primaryColor}20`,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: primaryColor }}>
                {specialists.length}
              </div>
              <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase" }}>
                Specialists
              </div>
            </div>
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), transparent)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>
                Active
              </div>
              <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase" }}>
                Status
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Specialists Grid */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              color: "#71717a",
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: interpolate(frame, [30, 50], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Team Members ({specialists.length})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 16,
            }}
          >
            {specialists.map((specialist, index) => (
              <AgentCard
                key={specialist.id}
                agent={specialist}
                startFrame={45 + index * 6}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 60,
          paddingBottom: 20,
        }}
      >
        {[
          { label: "Total Agents", value: agents.length.toString() },
          { label: "Director", value: "1" },
          { label: "Specialists", value: specialists.length.toString() },
          { label: "Automation", value: "100%" },
        ].map((stat, index) => {
          const statOpacity = interpolate(frame, [70 + index * 8, 90 + index * 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                opacity: statOpacity,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: "white" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
