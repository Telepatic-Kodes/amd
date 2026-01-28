import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { departmentColors } from "../utils/colors";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
    durationInFrames: 40,
  });

  const titleTranslateY = interpolate(titleY, [0, 1], [50, 0]);

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [30, 60], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Glow pulse for logo
  const glowOpacity = interpolate(
    Math.sin((frame / 30) * Math.PI * 2),
    [-1, 1],
    [0.3, 0.8]
  );

  // Department color dots animation
  const deptColors = Object.values(departmentColors);

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
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)`,
        }}
      />

      {/* Animated department color orbs */}
      {deptColors.map((color, index) => {
        const angle = (index / deptColors.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 350;
        const x = Math.cos(angle + frame / 200) * radius + width / 2;
        const y = Math.sin(angle + frame / 200) * radius + height / 2;
        const orbOpacity = interpolate(frame, [60 + index * 5, 90 + index * 5], [0, 0.3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x - 100,
              top: y - 100,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color.primary}40 0%, transparent 70%)`,
              opacity: orbOpacity,
              filter: "blur(40px)",
            }}
          />
        );
      })}

      {/* Logo */}
      <div
        style={{
          position: "relative",
          marginBottom: 40,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 60px rgba(99, 102, 241, ${glowOpacity})`,
          }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgb(129, 140, 248)" strokeWidth="1.5">
            <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
            <path d="M5 19l1 3 3-1-1-3-3 1z" opacity="0.5" />
            <path d="M19 19l-1 3-3-1 1-3 3 1z" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 700,
          background: "linear-gradient(to right, white, #a1a1aa)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          margin: 0,
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`,
          textAlign: "center",
        }}
      >
        AI Marketing Department
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 28,
          color: "#71717a",
          marginTop: 20,
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        37 AI Agents Powering Your Marketing
      </p>

      {/* Department indicator dots */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 60,
          opacity: subtitleOpacity,
        }}
      >
        {deptColors.map((color, index) => {
          const dotOpacity = interpolate(frame, [70 + index * 3, 85 + index * 3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={index}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: color.primary,
                opacity: dotOpacity,
                boxShadow: `0 0 10px ${color.glow}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
