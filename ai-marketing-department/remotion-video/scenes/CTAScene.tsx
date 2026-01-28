import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { departmentColors } from "../utils/colors";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Background fade in
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Main title animation
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [20, 60], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA button animation
  const buttonOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buttonScale = interpolate(frame, [60, 100], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  // Pulse effect for button
  const buttonPulse = frame > 100 ? 1 + Math.sin((frame / 15) * Math.PI * 2) * 0.03 : 1;

  // URL animation
  const urlOpacity = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Footer animation
  const footerOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
      }}
    >
      {/* Background gradient orbs */}
      {Object.values(departmentColors).map((color, i) => {
        const angle = (i / 7) * Math.PI * 2 + frame / 200;
        const radius = 400;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color.primary}15 0%, transparent 70%)`,
              filter: "blur(80px)",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* Main content */}
      <div
        style={{
          textAlign: "center",
          zIndex: 10,
        }}
      >
        {/* Main title */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginBottom: 24,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Ready to Transform
          <br />
          Your Marketing?
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            marginBottom: 60,
            opacity: subtitleOpacity,
          }}
        >
          37 AI Agents working 24/7 for your business
        </p>

        {/* CTA Button */}
        <div
          style={{
            opacity: buttonOpacity,
            transform: `scale(${buttonScale * buttonPulse})`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "20px 60px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 0 60px rgba(99, 102, 241, 0.4)",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "white",
              }}
            >
              Explore the Dashboard
            </span>
          </div>
        </div>

        {/* URL */}
        <p
          style={{
            fontSize: 20,
            color: "#71717a",
            marginTop: 40,
            opacity: urlOpacity,
            fontFamily: "monospace",
          }}
        >
          ai-marketing-department.vercel.app
        </p>
      </div>

      {/* Footer with tech stack */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          display: "flex",
          gap: 40,
          opacity: footerOpacity,
        }}
      >
        {["Next.js", "Convex", "Claude AI", "n8n"].map((tech, i) => (
          <div
            key={tech}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: ["#22c55e", "#f59e0b", "#a855f7", "#3b82f6"][i],
              }}
            />
            <span
              style={{
                fontSize: 16,
                color: "#71717a",
              }}
            >
              {tech}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
