import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { departmentColors } from "../utils/colors";

export const StatsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const stats = [
    { value: 37, label: "AI Agents", color: "#6366f1", description: "Autonomous workers" },
    { value: 6, label: "Departments", color: "#a855f7", description: "Specialized teams" },
    { value: 100, label: "Automated", suffix: "%", color: "#22c55e", description: "No human needed" },
    { value: 24, label: "Availability", suffix: "/7", color: "#f59e0b", description: "Always online" },
  ];

  // Background animation
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title animation
  const titleOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [5, 30], [-30, 0], {
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        opacity: bgOpacity,
        overflow: "hidden",
      }}
    >
      {/* Background particles */}
      {Object.values(departmentColors).map((color, i) => {
        const angle = (i / 7) * Math.PI * 2;
        const radius = 350 + Math.sin(frame / 50 + i) * 50;
        const x = width / 2 + Math.cos(angle + frame / 150) * radius;
        const y = height / 2 + Math.sin(angle + frame / 150) * radius;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color.primary}15 0%, transparent 70%)`,
              filter: "blur(60px)",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 80,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h2
          style={{
            fontSize: 52,
            fontWeight: 700,
            background: "linear-gradient(135deg, white 0%, #a1a1aa 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          By The Numbers
        </h2>
        <p
          style={{
            fontSize: 20,
            color: "#71717a",
            marginTop: 12,
          }}
        >
          Performance metrics that matter
        </p>
      </div>

      {/* Stats Grid - 2x2 centered */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 60,
          maxWidth: 900,
        }}
      >
        {stats.map((stat, index) => {
          const delay = index * 12;
          const cardOpacity = interpolate(frame, [25 + delay, 45 + delay], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardY = interpolate(frame, [25 + delay, 55 + delay], [40, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const cardScale = interpolate(frame, [25 + delay, 55 + delay], [0.9, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          return (
            <div
              key={stat.label}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px) scale(${cardScale})`,
              }}
            >
              <div
                style={{
                  padding: "40px 60px",
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${stat.color}08, transparent)`,
                  border: `1px solid ${stat.color}20`,
                  textAlign: "center",
                }}
              >
                <AnimatedCounter
                  endValue={stat.value}
                  startFrame={35 + delay}
                  duration={50}
                  fontSize={80}
                  color={stat.color}
                  suffix={stat.suffix}
                />
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: "white",
                    marginTop: 12,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#71717a",
                    marginTop: 6,
                  }}
                >
                  {stat.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [120, 150], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span
          style={{
            fontSize: 18,
            color: "#52525b",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Fully Autonomous Marketing Operations
        </span>
      </div>
    </div>
  );
};
