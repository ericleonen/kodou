import { useState } from "react";
import { useStore } from "../program/store";
import ActiveRun from "../run/ActiveRun";
import RunSetup from "../run/RunSetup";
import RunSummary from "../run/RunSummary";
import { RunConfig, RunRecording } from "../run/types";

/**
 * Run tab. Setup → live tracking → post-run summary, then back to setup.
 */
export default function RunScreen() {
  const { presets } = useStore();
  const [config, setConfig] = useState<RunConfig | null>(null);
  const [recording, setRecording] = useState<RunRecording | null>(null);

  if (config && recording) {
    const presetName = presets.find((p) => p.id === config.presetId)?.name ?? null;
    return (
      <RunSummary
        recording={recording}
        goal={config.goal}
        presetName={presetName}
        onDone={() => {
          setRecording(null);
          setConfig(null);
        }}
      />
    );
  }

  if (config) {
    return <ActiveRun config={config} onFinish={setRecording} />;
  }

  return <RunSetup onStart={setConfig} />;
}
