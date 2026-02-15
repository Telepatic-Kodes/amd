"use client";

interface Props {
  score: number;
  label: string;
  size?: number;
}

export function ScoreCircle({ score, label, size = 80 }: Props) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const color =
    score >= 70
      ? { stroke: "#22c55e", text: "text-[var(--success)]", bg: "text-green-500/10" }
      : score >= 41
        ? { stroke: "#eab308", text: "text-yellow-400", bg: "text-yellow-500/10" }
        : { stroke: "#ef4444", text: "text-[var(--error)]", bg: "text-[var(--error)]/10" };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[var(--text-primary)]"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color.text}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-[var(--text-tertiary)] text-center leading-tight">{label}</span>
    </div>
  );
}
