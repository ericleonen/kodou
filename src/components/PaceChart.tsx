import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Line, Path } from "react-native-svg";
import { colors, typography } from "../theme";
import { RunSample } from "../run/types";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type PaceMarker = { icon: IconName; t: number };

type Props = {
  samples: RunSample[];
  width: number;
  height: number;
  markers?: PaceMarker[];
  stroke?: string;
  strokeWidth?: number;
  padding?: number;
};

const MARKER = 22;

/**
 * Draws pace over time as a line. Speed samples are converted to pace
 * (min/km) for moving points; faster pace is drawn higher.
 */
export default function PaceChart({
  samples,
  width,
  height,
  markers = [],
  stroke = colors.primary,
  strokeWidth = 2,
  padding = 8,
}: Props) {
  if (width <= 0 || height <= 0) return <View style={{ width, height }} />;

  const pts = samples
    .filter((s) => s.speed > 0.3)
    .map((s) => ({ t: s.t, pace: 1000 / s.speed / 60 }));

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

  const availW = width - 2 * padding;
  const availH = height - 2 * padding;

  const project = (p: { t: number; pace: number }) => ({
    x: padding + ((p.t - minT) / spanT) * availW,
    // Faster pace (smaller value) sits higher on the chart.
    y: padding + ((p.pace - minP) / (maxP - minP)) * availH,
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${project(p).x} ${project(p).y}`).join(" ");

  const markerX = (t: number) => padding + ((Math.max(minT, Math.min(t, maxT)) - minT) / spanT) * availW;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {markers.map((m, i) => {
          const x = markerX(m.t);
          return (
            <Line
              key={`l${i}`}
              x1={x}
              y1={padding + MARKER / 2}
              x2={x}
              y2={height - padding}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}
        <Path
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      {markers.map((m, i) => (
        <View
          key={`m${i}`}
          style={[styles.marker, { left: markerX(m.t) - MARKER / 2, top: 0 }]}
        >
          <MaterialCommunityIcons name={m.icon} size={12} color={colors.primary} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...typography.label,
    color: colors.textFaint,
  },
  marker: {
    position: "absolute",
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
