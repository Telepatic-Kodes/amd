"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  delay = 0,
  formatter = (v) => Math.round(v).toLocaleString(),
  className,
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => formatter(current));

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, value, delay, spring, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Simpler version using requestAnimationFrame for better performance
interface SimpleCounterProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function SimpleCounter({
  value,
  duration = 1000,
  formatter = (v) => Math.round(v).toLocaleString(),
  className,
  prefix = '',
  suffix = '',
}: SimpleCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { margin: '-50px' });
  const prevValue = useRef(0);

  useEffect(() => {
    // When not in view, update value instantly (no animation)
    // so counters don't stay stuck at 0 when data loads off-screen
    if (!isInView) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    const startValue = prevValue.current;
    const endValue = value;
    prevValue.current = value;

    // Skip animation if values are the same
    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(progress < 1 ? current : endValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{formatter(displayValue)}{suffix}
    </span>
  );
}

// Currency counter
interface CurrencyCounterProps {
  value: number;
  currency?: string;
  locale?: string;
  duration?: number;
  className?: string;
}

export function CurrencyCounter({
  value,
  currency = 'USD',
  locale = 'en-US',
  duration = 1500,
  className,
}: CurrencyCounterProps) {
  const formatter = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);

  return (
    <SimpleCounter
      value={value}
      duration={duration}
      formatter={formatter}
      className={className}
    />
  );
}

// Percentage counter
interface PercentageCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function PercentageCounter({
  value,
  decimals = 1,
  duration = 1500,
  className,
}: PercentageCounterProps) {
  const formatter = (v: number) => `${v.toFixed(decimals)}%`;

  return (
    <SimpleCounter
      value={value}
      duration={duration}
      formatter={formatter}
      className={className}
    />
  );
}
