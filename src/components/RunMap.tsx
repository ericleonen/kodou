import { useEffect, useRef, useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import * as Location from "expo-location";
import { spacing, typography, useColors } from "../theme";
import { RunPoint } from "../run/types";

type Props = {
  style?: StyleProp<ViewStyle>;
  /** Show the user's location + heading and follow it (live map). */
  live?: boolean;
  /** A recorded path to draw as a polyline. */
  path?: RunPoint[];
  /** Inset (px) that keeps the followed location clear of overlays. */
  mapPadding?: { top?: number; right?: number; bottom?: number; left?: number };
};

/** Computes a region that frames a path with a little padding. */
function regionForPath(path: RunPoint[]): Region {
  const lats = path.map((p) => p.latitude);
  const lngs = path.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.004),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.004),
  };
}

/**
 * A map for a run: either live (current location + heading) or showing a
 * recorded path. On Android this is Google Maps (needs an API key); on
 * iOS it falls back to Apple Maps.
 */
export default function RunMap({ style, live, path = [], mapPadding }: Props) {
  const c = useColors();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    let active = true;
    if (live) {
      (async () => {
        const loc =
          (await Location.getLastKnownPositionAsync().catch(() => null)) ??
          (await Location.getCurrentPositionAsync({}).catch(() => null));
        if (active && loc) {
          setRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          });
        }
      })();
    } else if (path.length > 0) {
      setRegion(regionForPath(path));
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  function onReady() {
    if (path.length > 1) {
      mapRef.current?.fitToCoordinates(path, {
        edgePadding: { top: 32, right: 32, bottom: 32, left: 32 },
        animated: false,
      });
    }
  }

  if (!region) {
    return (
      <View style={[styles.placeholder, { backgroundColor: c.surfaceAlt }, style]}>
        <Text style={[styles.placeholderText, { color: c.textFaint }]}>
          {live ? "Finding your location…" : "No location data"}
        </Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={region}
      mapPadding={
        mapPadding && {
          top: mapPadding.top ?? 0,
          right: mapPadding.right ?? 0,
          bottom: mapPadding.bottom ?? 0,
          left: mapPadding.left ?? 0,
        }
      }
      showsUserLocation={!!live}
      followsUserLocation={!!live}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      onMapReady={onReady}
    >
      {path.length > 1 ? (
        <>
          <Polyline coordinates={path} strokeColor={c.primary} strokeWidth={4} />
          <Marker coordinate={path[0]} pinColor={c.success} title="Start" />
          <Marker coordinate={path[path.length - 1]} pinColor={c.primary} title="Finish" />
        </>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  placeholderText: {
    ...typography.label,
  },
});
