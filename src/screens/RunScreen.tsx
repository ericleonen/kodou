import { useState } from "react";
import { useStore } from "../program/store";
import { useSettings } from "../settings/settings";
import ActiveRun from "../run/ActiveRun";
import Countdown from "../run/Countdown";
import RunSetup from "../run/RunSetup";
import RunSummary from "../run/RunSummary";
import { resetRun, startRun, useRunEngine } from "../run/runEngine";
import { RunConfig } from "../run/types";

/**
 * Run tab. Its screen is driven by the run engine's phase, so an active
 * run keeps going (and stays on screen) even across tab switches.
 */
export default function RunScreen() {
  const { presets, sounds } = useStore();
  const settings = useSettings();
  const engine = useRunEngine();
  // A start pending behind the countdown overlay.
  const [pendingStart, setPendingStart] = useState<(() => void) | null>(null);

  if (engine.phase === "summary" && engine.config && engine.recording) {
    const presetName = presets.find((p) => p.id === engine.config!.presetId)?.name ?? null;
    return (
      <RunSummary
        recording={engine.recording}
        goal={engine.config.goal}
        presetName={presetName}
        onDone={resetRun}
      />
    );
  }

  if (engine.phase === "active" && engine.config) {
    return <ActiveRun />;
  }

  function begin(config: RunConfig) {
    const preset = presets.find((p) => p.id === config.presetId);
    const go = () =>
      startRun(config, preset?.rules ?? [], sounds, {
        autoPause: settings.autoPause,
        cueVolume: settings.cueVolume,
        duckAudio: settings.duckAudio,
      });
    if (settings.startCountdown) setPendingStart(() => go);
    else go();
  }

  return (
    <>
      <RunSetup onStart={begin} />
      {pendingStart ? (
        <Countdown
          onDone={() => {
            const go = pendingStart;
            setPendingStart(null);
            go();
          }}
          onCancel={() => setPendingStart(null)}
        />
      ) : null}
    </>
  );
}
