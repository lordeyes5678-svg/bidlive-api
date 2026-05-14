import React, { useEffect, useState } from "react";
import { Text, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CountdownTimerProps {
  endTime: string;
  size?: "small" | "large";
}

export function CountdownTimer({ endTime, size = "small" }: CountdownTimerProps) {
  const colors = useColors();
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number; ended: boolean } | null>(null);

  useEffect(() => {
    const target = new Date(endTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, ended: true });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ d, h, m, s, ended: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) return null;

  if (timeLeft.ended) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, size === "large" && styles.largeText, { color: colors.destructive }]}>ENDED</Text>
      </View>
    );
  }

  const totalMinutes = timeLeft.d * 24 * 60 + timeLeft.h * 60 + timeLeft.m;
  const isDanger = totalMinutes < 5;
  const isWarning = totalMinutes < 60 && !isDanger;

  let color = colors.foreground;
  if (isDanger) color = colors.destructive;
  else if (isWarning) color = colors.primary;

  const parts = [];
  if (timeLeft.d > 0) parts.push(`${timeLeft.d}d`);
  if (timeLeft.h > 0 || timeLeft.d > 0) parts.push(`${timeLeft.h}h`);
  parts.push(`${timeLeft.m}m`);
  parts.push(`${timeLeft.s}s`);

  return (
    <View style={styles.container}>
      <Text style={[styles.text, size === "large" && styles.largeText, { color }]}>
        {parts.join(" ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  largeText: {
    fontSize: 28,
    fontWeight: "900",
  },
});
