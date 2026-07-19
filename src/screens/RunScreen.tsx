import { useStore } from "../program/store";
import ActiveRun from "../run/ActiveRun";
import RunSetup from "../run/RunSetup";
import RunSummary from "../run/RunSummary";
import { resetRun, startRun, useRunEngine } from "../run/runEngine";

/**
 * Run tab. Its screen is driven by the run engine's phase, so an active
 * run keeps going (and stays on screen) even across tab switches.
 */
export default function RunScreen() {
  const { presets, sounds } = useStore();
  const engine = useRunEngine();

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

  return (
    <RunSetup
      onStart={(config) => {
        const preset = presets.find((p) => p.id === config.presetId);
        startRun(config, preset?.rules ?? [], sounds);
      }}
    />
  );
}
