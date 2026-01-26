import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AgentCard } from "../components/AgentCard";
import { GlowingLine } from "../components/GlowingLine";
import { getCMO, getDirectors, getDepartments, getAgentsByDepartment } from "../utils/agentData";
import { departmentColors, departmentLabels } from "../utils/colors";

export const OrgChartScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const cmo = getCMO();
  const directors = getDirectors();
  const departments = getDepartments();

  // Layout constants - centered and balanced
  const padding = 80;
  const cmoY = 140;
  const directorY = 340;
  const specialistY = 560;

  // Calculate director positions - evenly distributed
  const usableWidth = width - (padding * 2);
  const directorSpacing = usableWidth / departments.length;

  const directorPositions = departments.map((_, i) => ({
    x: padding + directorSpacing * i + directorSpacing / 2,
    y: directorY,
  }));

  // CMO center position
  const cmoX = width / 2;

  // Fade in
  const sceneOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title animation
  const titleOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [5, 30], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#0a0a0a",
        position: "relative",
        opacity: sceneOpacity,
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
          background: "radial-gradient(ellipse at center top, rgba(99, 102, 241, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            background: "linear-gradient(135deg, white 0%, #a1a1aa 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Organizational Structure
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "#71717a",
            marginTop: 8,
          }}
        >
          37 AI Agents • 6 Departments • Fully Automated
        </p>
      </div>

      {/* SVG for connection lines */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        {/* CMO to Directors lines */}
        {directorPositions.map((pos, index) => (
          <GlowingLine
            key={`cmo-dir-${index}`}
            x1={cmoX}
            y1={cmoY + 60}
            x2={pos.x}
            y2={pos.y - 45}
            color="#4f46e5"
            startFrame={35 + index * 5}
            duration={30}
          />
        ))}

        {/* Director to Specialists lines */}
        {departments.map((dept, deptIndex) => {
          const specialists = getAgentsByDepartment(dept).filter(a => a.role === "specialist");
          const dirPos = directorPositions[deptIndex];
          const colors = departmentColors[dept as keyof typeof departmentColors];
          const numSpecs = Math.min(specialists.length, 4);
          const specSpacing = 65;
          const totalWidth = (numSpecs - 1) * specSpacing;
          const startX = dirPos.x - totalWidth / 2;

          return specialists.slice(0, numSpecs).map((_, specIndex) => {
            const specX = startX + specIndex * specSpacing;
            return (
              <GlowingLine
                key={`dir-spec-${deptIndex}-${specIndex}`}
                x1={dirPos.x}
                y1={dirPos.y + 45}
                x2={specX}
                y2={specialistY - 25}
                color={colors?.primary || "#3f3f46"}
                startFrame={90 + deptIndex * 8 + specIndex * 3}
                duration={20}
              />
            );
          });
        })}
      </svg>

      {/* CMO Agent - centered at top */}
      <div
        style={{
          position: "absolute",
          left: cmoX,
          top: cmoY,
          transform: "translateX(-50%)",
        }}
      >
        <AgentCard agent={cmo} startFrame={15} size="lg" showGlow />
      </div>

      {/* Directors Row */}
      {directors.map((director, index) => {
        const pos = directorPositions[index];
        const dept = departments[index];
        const colors = departmentColors[dept as keyof typeof departmentColors];

        return (
          <div
            key={director.id}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              transform: "translateX(-50%)",
            }}
          >
            <AgentCard
              agent={director}
              startFrame={45 + index * 6}
              size="md"
            />
            {/* Department label */}
            <div
              style={{
                textAlign: "center",
                marginTop: 8,
                opacity: interpolate(frame, [60 + index * 6, 80 + index * 6], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: colors?.primary || "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {departmentLabels[dept] || dept}
              </span>
            </div>
          </div>
        );
      })}

      {/* Specialists Row - 4 per department */}
      {departments.map((dept, deptIndex) => {
        const specialists = getAgentsByDepartment(dept).filter(a => a.role === "specialist");
        const dirPos = directorPositions[deptIndex];
        const numSpecs = Math.min(specialists.length, 4);
        const specSpacing = 65;
        const totalWidth = (numSpecs - 1) * specSpacing;
        const startX = dirPos.x - totalWidth / 2;

        return specialists.slice(0, numSpecs).map((specialist, specIndex) => {
          const specX = startX + specIndex * specSpacing;
          return (
            <div
              key={specialist.id}
              style={{
                position: "absolute",
                left: specX,
                top: specialistY,
                transform: "translateX(-50%)",
              }}
            >
              <AgentCard
                agent={specialist}
                startFrame={110 + deptIndex * 10 + specIndex * 4}
                size="sm"
              />
            </div>
          );
        });
      })}

      {/* Bottom Stats Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 80,
          paddingBottom: 20,
        }}
      >
        {[
          { label: "Total Agents", value: "37", color: "#6366f1" },
          { label: "Departments", value: "6", color: "#a855f7" },
          { label: "Status", value: "Active", color: "#22c55e" },
        ].map((stat, index) => {
          const statOpacity = interpolate(frame, [250 + index * 15, 280 + index * 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const statY = interpolate(frame, [250 + index * 15, 280 + index * 15], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          return (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                opacity: statOpacity,
                transform: `translateY(${statY}px)`,
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
