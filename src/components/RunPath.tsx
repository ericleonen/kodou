import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, typography } from "../theme";
import { RunPoint } from "../run/types";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type PathMarker = { icon: IconName; latitude: number; longitude: number };

type Props = {
  path: RunPoint[];
  width: number;
  height: number;
  markers?: PathMarker[];
  stroke?: string;
  strokeWidth?: number;
  padding?: number;
};

/**
 * Draws a run's GPS track as a normalized polyline. Longitude is scaled
 * by cos(latitude) so the shape isn't horizontally distorted, and the
 * whole track is fit into the box with the aspect ratio preserved.
 */
export default function RunPath({
  path,
  width,
  height,
  markers = [],
  stroke = colors.primary,
  strokeWidth = 3,
  padding = 10,
}: Props) {
  if (width <= 0 || height <= 0) return <View style={{ width, height }} />;
  if (path.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>No path recorded</Text>
      </View>
    );
  }

  const latMean = path.reduce((sum, p) => sum + p.latitude, 0) / path.length;
  const k = Math.cos((latMean * Math.PI) / 180);
  const pts = path.map((p) => ({ x: p.longitude * k, y: p.latitude }));

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;

  const availW = width - 2 * padding;
  const availH = height - 2 * padding;
  const scale = Math.min(availW / spanX, availH / spanY);
  const offX = padding + (availW - spanX * scale) / 2;
  const offY = padding + (availH - spanY * scale) / 2;

  const project = (p: { x: number; y: number }) => ({
    x: offX + (p.x - minX) * scale,
    y: offY + (maxY - p.y) * scale, // invert Y so north is up
  });

  const projected = pts.map(project);
  const d = projected.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const startPt = projected[0];
  const endPt = projected[projected.length - 1];

  const markerPoints = markers.map((m) => ({
    icon: m.icon,
    ...project({ x: m.longitude * k, y: m.latitude }),
  }));

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={startPt.x} cy={startPt.y} r={strokeWidth + 1} fill={colors.success} />
        <Circle cx={endPt.x} cy={endPt.y} r={strokeWidth + 1} fill={colors.primary} />
      </Svg>
      {markerPoints.map((m, i) => (
        <View key={i} style={[styles.marker, { left: m.x - MARKER / 2, top: m.y - MARKER / 2 }]}>
          <MaterialCommunityIcons name={m.icon} size={13} color={colors.primary} />
        </View>
      ))}
    </View>
  );
}

const MARKER = 24;

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
