import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface AnimatedCounterProps {
  endValue: number;
  startFrame?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  endValue,
  startFrame = 0,
  duration = 60,
  fontSize = 72,
  color = "white",
  prefix = "",
  suffix = "",
}) => {
  const frame = useCurrentFrame();

  const value = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, endValue],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const scale = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [0.8, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.5)),
    }
  );

  return (
    <div
      style={{
        fontSize,
        fontWeight: 700,
        color,
        opacity,
        transform: `scale(${scale})`,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}
      {Math.floor(value)}
      {suffix}
    </div>
  );
};
