import { useState } from "react";
import ActiveRun from "../run/ActiveRun";
import RunSetup from "../run/RunSetup";
import { RunConfig } from "../run/types";

/**
 * Run tab. Shows the setup form until a run is started, then swaps to
 * the live tracking screen until the run is ended.
 */
export default function RunScreen() {
  const [config, setConfig] = useState<RunConfig | null>(null);

  if (config) {
    return <ActiveRun config={config} onStop={() => setConfig(null)} />;
  }
  return <RunSetup onStart={setConfig} />;
}
