import { interpolate, Easing } from "remotion";

// Fade in animation
export const fadeIn = (frame: number, startFrame: number, duration: number) => {
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
};

// Fade out animation
export const fadeOut = (frame: number, startFrame: number, duration: number) => {
  return interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
};

// Scale in animation
export const scaleIn = (frame: number, startFrame: number, duration: number) => {
  return interpolate(frame, [startFrame, startFrame + duration], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });
};

// Slide in from bottom
export const slideInFromBottom = (frame: number, startFrame: number, duration: number) => {
  return interpolate(frame, [startFrame, startFrame + duration], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
};

// Slide in from left
export const slideInFromLeft = (frame: number, startFrame: number, duration: number) => {
  return interpolate(frame, [startFrame, startFrame + duration], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
};

// Staggered delay calculator
export const getStaggerDelay = (index: number, delayPerItem: number) => {
  return index * delayPerItem;
};

// Pulsing glow effect
export const pulseGlow = (frame: number, speed: number = 30) => {
  return interpolate(
    Math.sin((frame / speed) * Math.PI * 2),
    [-1, 1],
    [0.3, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
};

// Counter animation (for stats)
export const countTo = (frame: number, startFrame: number, duration: number, endValue: number) => {
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return Math.floor(progress * endValue);
};

// Line drawing animation (for SVG paths)
export const drawLine = (frame: number, startFrame: number, duration: number, pathLength: number) => {
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return {
    strokeDasharray: pathLength,
    strokeDashoffset: pathLength * (1 - progress),
  };
};
