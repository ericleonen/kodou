import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";
import { typography, useColors } from "../theme";
import { formatDuration } from "../run/format";
import { RunSample } from "../run/types";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type PaceMarker = { icon: IconName; t: number };

type Props = {
  samples: RunSample[];
  width: number;
  height: number;
  markers?: PaceMarker[];
  /** Distance unit the pace axis is measured against. */
  paceUnit?: "km" | "mi";
  stroke?: string;
  strokeWidth?: number;
  padding?: number;
};

const MARKER = 22;
const GUTTER_LEFT = 44; // room for pace (y-axis) labels
const GUTTER_BOTTOM = 20; // room for time (x-axis) labels

/** A pace value (minutes) as m:ss. */
function formatPace(minutes: number): string {
  return formatDuration(minutes * 60);
}

/**
 * Draws pace over time as a line, with pace (y) and time (x) axis ticks.
 * Speed samples are converted to pace for moving points; faster pace is
 * drawn higher.
 */
export default function PaceChart({
  samples,
  width,
  height,
  markers = [],
  paceUnit = "km",
  stroke,
  strokeWidth = 2,
  padding = 8,
}: Props) {
  const c = useColors();
  const styles = useStyles();
  const strokeColor = stroke ?? c.primary;
  if (width <= 0 || height <= 0) return <View style={{ width, height }} />;

  const paceMeters = paceUnit === "mi" ? 1609.344 : 1000;
  const pts = samples
    .filter((s) => s.speed > 0.3)
    .map((s) => ({ t: s.t, pace: paceMeters / s.speed / 60 }));

  if (pts.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Not enough pace data</Text>
      </View>
    );
  }

  const ts = pts.map((p) => p.t);
  const paces = pts.map((p) => p.pace);
  const minT = Math.min(...ts);
  const maxT = Math.max(...ts);
  const spanT = maxT - minT || 1;
  const minP = Math.min(...paces);
  let maxP = Math.max(...paces);
  if (maxP - minP < 0.1) maxP = minP + 0.1;

  const plotX0 = GUTTER_LEFT;
  const plotY0 = padding + MARKER / 2; // leave room for marker bubbles up top
  const plotW = width - GUTTER_LEFT - padding;
  const plotH = height - plotY0 - GUTTER_BOTTOM;

  const project = (p: { t: number; pace: number }) => ({
    x: plotX0 + ((p.t - minT) / spanT) * plotW,
    // Faster pace (smaller value) sits higher on the chart.
    y: plotY0 + ((p.pace - minP) / (maxP - minP)) * plotH,
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${project(p).x} ${project(p).y}`).join(" ");

  const markerX = (t: number) =>
    plotX0 + ((Math.max(minT, Math.min(t, maxT)) - minT) / spanT) * plotW;

  // Pace (y) ticks: fastest at the top, slowest at the bottom.
  const yTicks = [0, 0.5, 1].map((f) => ({
    pace: minP + f * (maxP - minP),
    y: plotY0 + f * plotH,
  }));

  // Time (x) ticks along the bottom.
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    t: minT + f * spanT,
    x: plotX0 + f * plotW,
  }));

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {yTicks.map((tick, i) => (
          <Line
            key={`y${i}`}
            x1={plotX0}
            y1={tick.y}
            x2={plotX0 + plotW}
            y2={tick.y}
            stroke={c.border}
            strokeWidth={1}
          />
        ))}
        {yTicks.map((tick, i) => (
          <SvgText
            key={`yl${i}`}
            x={plotX0 - 6}
            y={tick.y + 3}
            fontSize={10}
            fill={c.textMuted}
            textAnchor="end"
          >
            {formatPace(tick.pace)}
          </SvgText>
        ))}
        {xTicks.map((tick, i) => (
          <SvgText
            key={`xl${i}`}
            x={tick.x}
            y={height - 6}
            fontSize={10}
            fill={c.textMuted}
            textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
          >
            {formatDuration(tick.t)}
          </SvgText>
        ))}
        {markers.map((m, i) => {
          const x = markerX(m.t);
          return (
            <Line
              key={`l${i}`}
              x1={x}
              y1={plotY0}
              x2={x}
              y2={plotY0 + plotH}
              stroke={c.border}
              strokeWidth={1}
            />
          );
        })}
        <Path
          d={d}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={styles.unit}>min/{paceUnit}</Text>
      {markers.map((m, i) => (
        <View
          key={`m${i}`}
          style={[styles.marker, { left: markerX(m.t) - MARKER / 2, top: 0 }]}
        >
          <MaterialCommunityIcons name={m.icon} size={12} color={c.primary} />
        </View>
      ))}
    </View>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...typography.label,
    color: c.textFaint,
  },
  unit: {
    position: "absolute",
    left: 0,
    top: 0,
    ...typography.label,
    fontSize: 10,
    color: c.textFaint,
  },
  marker: {
    position: "absolute",
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
    }), [c]);
}
