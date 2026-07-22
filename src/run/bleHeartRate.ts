/**
 * Bluetooth Low Energy heart-rate source.
 *
 * Reads the standard BLE Heart Rate Service (GATT 0x180D, measurement
 * characteristic 0x2A37), so it works with any standard sensor — chest
 * straps (Polar H10, Wahoo TICKR, Garmin HRM) and armbands (CooSpo), plus a
 * Wear OS watch running a "broadcast HR over Bluetooth" app.
 *
 * react-native-ble-plx is a native module, so it's imported dynamically:
 * nothing here loads until the user actually connects a sensor.
 */

import { PermissionsAndroid, Platform } from "react-native";
import type { HeartRateSource, SourceCallbacks } from "./heartRate";

const HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
const HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";
const SCAN_TIMEOUT_MS = 15000;

// atob is provided by the RN (Hermes) runtime but isn't in the TS lib here.
const decodeBase64: (s: string) => string = (globalThis as { atob?: (s: string) => string }).atob!;

/**
 * Parses a Heart Rate Measurement value (base64). Flags bit 0 selects the
 * format: 0 → the BPM is a uint8 in byte 1, 1 → a uint16 in bytes 1–2.
 */
function parseHeartRate(base64Value: string): number | null {
  try {
    const bin = decodeBase64(base64Value);
    if (bin.length < 2) return null;
    const flags = bin.charCodeAt(0);
    const is16Bit = (flags & 0x01) === 1;
    if (is16Bit) {
      if (bin.length < 3) return null;
      return bin.charCodeAt(1) | (bin.charCodeAt(2) << 8);
    }
    return bin.charCodeAt(1);
  } catch {
    return null;
  }
}

/** Resolves once the adapter is powered on, or rejects with a clear reason. */
function waitForPoweredOn(manager: { onStateChange: (cb: (s: string) => void, emit: boolean) => { remove: () => void } }): Promise<void> {
  return new Promise((resolve, reject) => {
    const sub = manager.onStateChange((state) => {
      if (state === "PoweredOn") {
        sub.remove();
        resolve();
      } else if (state === "PoweredOff") {
        sub.remove();
        reject(new Error("Turn on Bluetooth to connect a heart-rate sensor."));
      } else if (state === "Unsupported") {
        sub.remove();
        reject(new Error("This device doesn't support Bluetooth Low Energy."));
      }
    }, true);
  });
}

export function createBleHeartRateSource(): HeartRateSource {
  // Kept loosely typed: the ble-plx types would force a static import.
  let manager: any = null;
  let device: any = null;
  let monitorSub: { remove: () => void } | null = null;
  let scanTimer: ReturnType<typeof setTimeout> | null = null;
  let cb: SourceCallbacks | null = null;
  let wantConnected = false;
  let reconnecting = false;

  async function ensurePermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    const P = PermissionsAndroid.PERMISSIONS;
    const perms =
      Number(Platform.Version) >= 31
        ? [P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT]
        : [P.ACCESS_FINE_LOCATION];
    const result = await PermissionsAndroid.requestMultiple(perms);
    return perms.every((p) => result[p] === PermissionsAndroid.RESULTS.GRANTED);
  }

  async function subscribe(d: any) {
    await d.discoverAllServicesAndCharacteristics();
    monitorSub = d.monitorCharacteristicForService(
      HR_SERVICE,
      HR_MEASUREMENT,
      (error: unknown, ch: { value?: string | null } | null) => {
        if (error) {
          if (wantConnected) void attemptReconnect();
          return;
        }
        const value = ch?.value;
        if (!value || !cb) return;
        const bpm = parseHeartRate(value);
        if (bpm != null && bpm > 0) cb.onBpm(bpm);
      }
    );
  }

  function scanAndConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!manager) {
        reject(new Error("Bluetooth is unavailable."));
        return;
      }
      cb?.onStatus("scanning");
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (scanTimer) clearTimeout(scanTimer);
        manager.stopDeviceScan();
        fn();
      };

      scanTimer = setTimeout(
        () => finish(() => reject(new Error("No heart-rate sensor found. Make sure it's on and nearby."))),
        SCAN_TIMEOUT_MS
      );

      manager.startDeviceScan([HR_SERVICE], null, async (error: unknown, scanned: any) => {
        if (error) {
          finish(() => reject(error instanceof Error ? error : new Error("Bluetooth scan failed.")));
          return;
        }
        if (!scanned || settled) return;
        const name = scanned.name ?? scanned.localName ?? "Heart-rate sensor";
        finish(() => {});
        try {
          cb?.onStatus("connecting", { deviceName: name });
          const connected = await scanned.connect();
          device = connected;
          connected.onDisconnected(() => {
            if (wantConnected) void attemptReconnect();
            else cb?.onStatus("disconnected");
          });
          await subscribe(connected);
          cb?.onStatus("connected", { deviceName: connected.name ?? name });
          resolve();
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Couldn't connect to the sensor."));
        }
      });
    });
  }

  async function attemptReconnect() {
    if (!wantConnected || reconnecting) return;
    reconnecting = true;
    cb?.onStatus("connecting");
    try {
      await scanAndConnect();
    } catch {
      cb?.onStatus("disconnected", { error: "Lost connection to the sensor." });
    } finally {
      reconnecting = false;
    }
  }

  return {
    id: "ble",
    label: "Bluetooth sensor",
    async start(callbacks) {
      cb = callbacks;
      wantConnected = true;
      const { BleManager } = await import("react-native-ble-plx");
      if (!manager) manager = new BleManager();
      const granted = await ensurePermissions();
      if (!granted) throw new Error("Bluetooth permission is needed to connect a heart-rate sensor.");
      await waitForPoweredOn(manager);
      await scanAndConnect();
    },
    async stop() {
      wantConnected = false;
      if (scanTimer) clearTimeout(scanTimer);
      try {
        manager?.stopDeviceScan();
      } catch {
        // ignore
      }
      try {
        monitorSub?.remove();
      } catch {
        // ignore
      }
      try {
        if (device) await device.cancelConnection();
      } catch {
        // ignore
      }
      device = null;
    },
  };
}
