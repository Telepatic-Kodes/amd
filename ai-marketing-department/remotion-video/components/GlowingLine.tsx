import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface GlowingLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  startFrame?: number;
  duration?: number;
  strokeWidth?: number;
  showPulse?: boolean;
}

export const GlowingLine: React.FC<GlowingLineProps> = ({
  x1,
  y1,
  x2,
  y2,
  color = "#6366f1",
  startFrame = 0,
  duration = 30,
  strokeWidth = 2,
  showPulse = false,
}) => {
  const frame = useCurrentFrame();

  // Calculate path length
  const pathLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

  // Draw animation
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  const dashOffset = pathLength * (1 - progress);

  // Opacity
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Pulse effect
  const pulseOpacity = showPulse
    ? interpolate(Math.sin((frame / 15) * Math.PI * 2), [-1, 1], [0.3, 1])
    : 1;

  return (
    <g opacity={opacity}>
      {/* Glow effect */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth + 4}
        strokeLinecap="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        opacity={0.3 * pulseOpacity}
        filter="blur(4px)"
      />
      {/* Main line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        opacity={pulseOpacity}
      />
    </g>
  );
};

interface ConnectionLinesProps {
  fromX: number;
  fromY: number;
  toPoints: Array<{ x: number; y: number }>;
  color?: string;
  startFrame?: number;
  staggerDelay?: number;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  fromX,
  fromY,
  toPoints,
  color = "#3f3f46",
  startFrame = 0,
  staggerDelay = 5,
}) => {
  return (
    <>
      {toPoints.map((point, index) => (
        <GlowingLine
          key={index}
          x1={fromX}
          y1={fromY}
          x2={point.x}
          y2={point.y}
          color={color}
          startFrame={startFrame + index * staggerDelay}
          duration={20}
        />
      ))}
    </>
  );
};
