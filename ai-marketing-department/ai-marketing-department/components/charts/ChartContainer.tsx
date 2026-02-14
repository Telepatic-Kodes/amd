"use client";

import { useRef, useState, useEffect, type ReactElement } from "react";

interface ChartContainerProps {
  height?: number;
  width?: string;
  className?: string;
  children: ReactElement;
}

/**
 * Replaces Recharts' ResponsiveContainer to avoid the
 * "width(-1) height(-1)" warning.  Measures the wrapper div
 * with ResizeObserver and clones explicit pixel dimensions
 * into the single chart child.
 */
export function ChartContainer({
  height = 300,
  width = "100%",
  className,
  children,
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      if (w > 0 && h > 0) {
        setSize((prev) =>
          prev && prev.w === Math.round(w) && prev.h === Math.round(h)
            ? prev
            : { w: Math.round(w), h: Math.round(h) }
        );
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ height, width }}>
      {size && (
        <children.type {...children.props} width={size.w} height={size.h} />
      )}
    </div>
  );
}
